import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import html2canvas from "html2canvas";

export interface ExportOptions {
  container: HTMLElement;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  seekTo: (frame: number) => void;
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

function drawVideoToCanvas(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  cssW: number,
  cssH: number,
  fit: string,
) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  switch (fit) {
    case "contain": {
      const scale = Math.min(cssW / vw, cssH / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.drawImage(video, (cssW - dw) / 2, (cssH - dh) / 2, dw, dh);
      break;
    }
    case "cover": {
      const scale = Math.max(cssW / vw, cssH / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      ctx.drawImage(video, (cssW - dw) / 2, (cssH - dh) / 2, dw, dh);
      break;
    }
    default:
      ctx.drawImage(video, 0, 0, cssW, cssH);
  }
}

async function captureFrame(
  container: HTMLElement,
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  return html2canvas(container, {
    width,
    height,
    scale: 1,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#000000",
    logging: false,
    onclone: (_clonedDoc: Document, clonedEl: HTMLElement) => {
      const originalVideos = container.querySelectorAll("video");
      const clonedVideos = clonedEl.querySelectorAll("video");

      originalVideos.forEach((video, i) => {
        const clonedVideo = clonedVideos[i];
        if (!clonedVideo || video.readyState < 2) return;

        const styles = window.getComputedStyle(clonedVideo);
        const cssW = parseFloat(styles.width);
        const cssH = parseFloat(styles.height);

        const c = document.createElement("canvas");
        c.width = cssW;
        c.height = cssH;
        c.style.width = styles.width;
        c.style.height = styles.height;
        c.style.position = styles.position;
        c.style.top = styles.top;
        c.style.left = styles.left;
        c.style.right = styles.right;
        c.style.bottom = styles.bottom;
        c.style.display = styles.display;

        const ctx = c.getContext("2d");
        if (ctx) {
          drawVideoToCanvas(
            ctx,
            video,
            cssW,
            cssH,
            styles.objectFit || "contain",
          );
        }

        clonedVideo.parentElement?.replaceChild(c, clonedVideo);
      });
    },
  });
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

function waitForRender(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 50);
      });
    });
  });
}

export async function exportVideo(options: ExportOptions): Promise<Blob> {
  const {
    container,
    width,
    height,
    fps,
    totalFrames,
    seekTo,
    onProgress,
    signal,
  } = options;

  if (!isWebCodecsSupported()) {
    throw new Error(
      "Your browser does not support WebCodecs. Please use Chrome 94+ or Edge 94+ for video export.",
    );
  }

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width, height },
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });

  let encoderError: Error | null = null;

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta ?? undefined),
    error: (e) => {
      encoderError = e;
    },
  });

  encoder.configure({
    codec: getCodecString(width, height),
    width,
    height,
    bitrate: 20_000_000,
    framerate: fps,
  });

  try {
    for (let frame = 0; frame < totalFrames; frame++) {
      if (signal?.aborted)
        throw new DOMException("Export cancelled", "AbortError");
      if (encoderError) throw encoderError;

      seekTo(frame);
      await waitForRender();

      const canvas = await captureFrame(container, width, height);
      const videoFrame = new VideoFrame(canvas, {
        timestamp: Math.round(frame * (1_000_000 / fps)),
        duration: Math.round(1_000_000 / fps),
      });

      encoder.encode(videoFrame, { keyFrame: frame % (fps * 2) === 0 });
      videoFrame.close();

      if (encoder.encodeQueueSize > 2) {
        await waitForEncoderDrain(encoder);
      }

      onProgress(Math.round(((frame + 1) / totalFrames) * 100), frame + 1);
    }

    await encoder.flush();
    encoder.close();
    muxer.finalize();

    return new Blob([muxer.target.buffer], { type: "video/mp4" });
  } catch (e) {
    try {
      encoder.close();
    } catch {}
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
