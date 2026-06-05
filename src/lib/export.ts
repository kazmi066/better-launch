import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import type { AudioTrack, ProjectSettings, Slide } from "../types";
import { getActiveSlide } from "../engine/renderer";
import { renderScene } from "./scene";
import {
  ensureImageLoaded,
  getOrCreateVideo,
  seekVideo,
  waitForVideoReady,
} from "./media-cache";
import { encodeAudioToMuxer, prepareAudioForExport } from "./audio";

export interface ExportOptions {
  slides: Slide[];
  settings: ProjectSettings;
  audioTrack?: AudioTrack | null;
  onProgress: (percent: number, currentFrame: number) => void;
  signal?: AbortSignal;
}

export function isWebCodecsSupported(): boolean {
  return (
    typeof VideoEncoder !== "undefined" && typeof VideoFrame !== "undefined"
  );
}

function getCodecString(width: number, height: number): string {
  const pixels = width * height;
  if (pixels > 2073600) return "avc1.640033";
  if (pixels > 921600) return "avc1.640028";
  return "avc1.64001f";
}

function waitForEncoderDrain(encoder: VideoEncoder): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      if (encoder.encodeQueueSize <= 2) {
        resolve();
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
}

async function preloadMedia(slides: Slide[]): Promise<void> {
  const imagePromises: Promise<unknown>[] = [];
  const videoPromises: Promise<unknown>[] = [];

  for (const slide of slides) {
    if (slide.type === "standard") {
      if (slide.backgroundType === "image" && slide.backgroundImageUrl) {
        imagePromises.push(
          ensureImageLoaded(slide.backgroundImageUrl).catch(() => {}),
        );
      }
      if (slide.backgroundType === "video" && slide.backgroundVideoUrl) {
        const v = getOrCreateVideo(slide.backgroundVideoUrl);
        v.pause();
        videoPromises.push(waitForVideoReady(v).catch(() => {}));
      }
    }
    if (slide.type === "video" && slide.videoUrl) {
      const v = getOrCreateVideo(slide.videoUrl);
      v.pause();
      videoPromises.push(waitForVideoReady(v).catch(() => {}));
    }
    if (slide.type === "logo" && slide.logoImageUrl) {
      imagePromises.push(ensureImageLoaded(slide.logoImageUrl).catch(() => {}));
    }
  }

  await Promise.all([...imagePromises, ...videoPromises]);
}

async function syncVideoFrames(
  slides: Slide[],
  currentTime: number,
): Promise<void> {
  const active = getActiveSlide(slides, currentTime);
  if (!active) return;

  const seeks: Promise<void>[] = [];

  if (active.slide.type === "standard") {
    if (
      active.slide.backgroundType === "video" &&
      active.slide.backgroundVideoUrl
    ) {
      const v = getOrCreateVideo(active.slide.backgroundVideoUrl);
      if (v.readyState >= 2 && Number.isFinite(v.duration) && v.duration > 0) {
        const t = active.localTime % v.duration;
        seeks.push(seekVideo(v, t).catch(() => {}));
      }
    }
  } else if (active.slide.type === "video" && active.slide.videoUrl) {
    const v = getOrCreateVideo(active.slide.videoUrl);
    if (v.readyState >= 2 && Number.isFinite(v.duration) && v.duration > 0) {
      // Map slide-local time onto the trimmed window. trimEnd of 0
      // means "no trim configured" — fall back to the source duration.
      const slide = active.slide;
      const trimEnd = slide.trimEnd > 0 ? slide.trimEnd : v.duration;
      const t = Math.min(slide.trimStart + active.localTime, trimEnd);
      seeks.push(seekVideo(v, t).catch(() => {}));
    }
  }

  await Promise.all(seeks);
}

export async function exportVideo(options: ExportOptions): Promise<Blob> {
  const { slides, settings, audioTrack, onProgress, signal } = options;
  const { width, height, fps } = settings;

  if (!isWebCodecsSupported()) {
    throw new Error(
      "Your browser does not support WebCodecs. Please use Chrome 94+ or Edge 94+ for video export.",
    );
  }

  const totalSeconds = slides.reduce((sum, s) => {
    if (s.type === "standard" || s.type === "logo") {
      return sum + s.durationSeconds + s.delaySeconds;
    }
    return sum + s.durationSeconds;
  }, 0);
  const totalFrames = Math.max(1, Math.round(totalSeconds * fps));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Failed to acquire 2D context for export");

  // Decode + shape the audio track BEFORE configuring the muxer so the
  // audio track's sampleRate / channel count are known upfront. Muxer
  // audio config must match what the AudioEncoder emits.
  const preparedAudio =
    audioTrack && totalSeconds > 0
      ? await prepareAudioForExport(audioTrack, totalSeconds)
      : null;

  await preloadMedia(slides);

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width, height },
    audio: preparedAudio
      ? {
          codec: "aac",
          numberOfChannels: preparedAudio.numberOfChannels,
          sampleRate: preparedAudio.sampleRate,
        }
      : undefined,
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });

  let videoError: Error | null = null;

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta ?? undefined),
    error: (e) => {
      videoError = e;
    },
  });

  videoEncoder.configure({
    codec: getCodecString(width, height),
    width,
    height,
    bitrate: 20_000_000,
    framerate: fps,
  });

  const size = { width, height };

  try {
    for (let frame = 0; frame < totalFrames; frame++) {
      if (signal?.aborted)
        throw new DOMException("Export cancelled", "AbortError");
      if (videoError) throw videoError;

      const t = frame / fps;
      const active = getActiveSlide(slides, t);

      await syncVideoFrames(slides, t);
      renderScene(
        ctx,
        active ? active.slide : null,
        active ? active.localTime : 0,
        size,
      );

      const videoFrame = new VideoFrame(canvas, {
        timestamp: Math.round(frame * (1_000_000 / fps)),
        duration: Math.round(1_000_000 / fps),
      });

      videoEncoder.encode(videoFrame, { keyFrame: frame % (fps * 2) === 0 });
      videoFrame.close();

      if (videoEncoder.encodeQueueSize > 2) {
        await waitForEncoderDrain(videoEncoder);
      }

      onProgress(Math.round(((frame + 1) / totalFrames) * 100), frame + 1);
    }

    await videoEncoder.flush();
    videoEncoder.close();

    if (preparedAudio) {
      await encodeAudioToMuxer(preparedAudio, (chunk, meta) =>
        muxer.addAudioChunk(chunk, meta ?? undefined),
      );
    }

    muxer.finalize();

    return new Blob([muxer.target.buffer], { type: "video/mp4" });
  } catch (e) {
    try {
      videoEncoder.close();
    } catch {
      /* noop */
    }
    throw e;
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
