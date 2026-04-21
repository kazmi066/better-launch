import type { AudioTrack } from "../types";

const WAVEFORM_BINS = 400;

export async function decodeAudioFile(file: File): Promise<AudioTrack> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx: typeof AudioContext =
    (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) throw new Error("Web Audio API is not available");

  const ctx = new AudioCtx();
  let buffer: AudioBuffer;
  try {
    buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    ctx.close().catch(() => {});
  }

  const waveform = computeWaveformPeaks(buffer, WAVEFORM_BINS);
  const url = URL.createObjectURL(file);

  return {
    url,
    name: file.name,
    duration: buffer.duration,
    sampleRate: buffer.sampleRate,
    numberOfChannels: Math.min(buffer.numberOfChannels, 2),
    volume: 1,
    waveform,
  };
}

function computeWaveformPeaks(buffer: AudioBuffer, bins: number): number[] {
  const ch = buffer.getChannelData(0);
  const binSize = Math.max(1, Math.floor(ch.length / bins));
  const peaks: number[] = new Array(bins).fill(0);
  let max = 0;

  for (let i = 0; i < bins; i++) {
    const start = i * binSize;
    const end = Math.min(ch.length, start + binSize);
    let peak = 0;
    for (let j = start; j < end; j++) {
      const v = Math.abs(ch[j]!);
      if (v > peak) peak = v;
    }
    peaks[i] = peak;
    if (peak > max) max = peak;
  }

  if (max > 0) {
    for (let i = 0; i < peaks.length; i++) peaks[i] = peaks[i]! / max;
  }
  return peaks;
}

// Decoded PCM ready for the export encoder: looped / truncated to exactly
// `totalSeconds`, with volume baked in, and split per-channel (f32-planar
// layout expected by AudioData).
export interface PreparedAudio {
  sampleRate: number;
  numberOfChannels: number;
  totalSamples: number;
  channels: Float32Array[];
}

export async function prepareAudioForExport(
  track: AudioTrack,
  totalSeconds: number,
): Promise<PreparedAudio> {
  const res = await fetch(track.url);
  const arrayBuffer = await res.arrayBuffer();

  const AudioCtx: typeof AudioContext =
    (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AudioCtx();
  let buffer: AudioBuffer;
  try {
    buffer = await ctx.decodeAudioData(arrayBuffer);
  } finally {
    ctx.close().catch(() => {});
  }

  const sampleRate = buffer.sampleRate;
  const numberOfChannels = Math.min(buffer.numberOfChannels, 2);
  const totalSamples = Math.max(1, Math.ceil(totalSeconds * sampleRate));
  const volume = track.volume;

  const channels: Float32Array[] = [];
  for (let c = 0; c < numberOfChannels; c++) {
    const srcIndex = Math.min(c, buffer.numberOfChannels - 1);
    const src = buffer.getChannelData(srcIndex);
    const dst = new Float32Array(totalSamples);
    // Loop src across dst (handles track shorter than video); when src
    // is longer than dst we just never reach the end samples (truncated).
    for (let i = 0; i < totalSamples; i++) {
      dst[i] = src[i % src.length]! * volume;
    }
    channels.push(dst);
  }

  return { sampleRate, numberOfChannels, totalSamples, channels };
}

// Encodes the prepared PCM to AAC via WebCodecs and feeds every chunk to
// the muxer. Resolves once the encoder has flushed.
export async function encodeAudioToMuxer(
  audio: PreparedAudio,
  addChunk: (chunk: EncodedAudioChunk, meta?: EncodedAudioChunkMetadata) => void,
): Promise<void> {
  if (typeof AudioEncoder === "undefined" || typeof AudioData === "undefined") {
    throw new Error("AudioEncoder / AudioData not supported in this browser.");
  }

  let encoderError: Error | null = null;

  const encoder = new AudioEncoder({
    output: (chunk, meta) => addChunk(chunk, meta ?? undefined),
    error: (e) => {
      encoderError = e;
    },
  });

  encoder.configure({
    codec: "mp4a.40.2",
    sampleRate: audio.sampleRate,
    numberOfChannels: audio.numberOfChannels,
    bitrate: 192_000,
  });

  const CHUNK_FRAMES = 1024;
  const { sampleRate, numberOfChannels, totalSamples, channels } = audio;

  for (let offset = 0; offset < totalSamples; offset += CHUNK_FRAMES) {
    if (encoderError) throw encoderError;

    const numFrames = Math.min(CHUNK_FRAMES, totalSamples - offset);

    // f32-planar requires a contiguous Float32 array of length
    // numFrames * numberOfChannels, laid out as:
    //   [ch0 f0, ch0 f1, ..., ch1 f0, ch1 f1, ...]
    const planar = new Float32Array(numFrames * numberOfChannels);
    for (let c = 0; c < numberOfChannels; c++) {
      planar.set(
        channels[c]!.subarray(offset, offset + numFrames),
        c * numFrames,
      );
    }

    const audioData = new AudioData({
      format: "f32-planar",
      sampleRate,
      numberOfFrames: numFrames,
      numberOfChannels,
      timestamp: Math.round((offset / sampleRate) * 1_000_000),
      data: planar,
    });

    encoder.encode(audioData);
    audioData.close();
  }

  await encoder.flush();
  if (encoderError) throw encoderError;
  encoder.close();
}

export function formatAudioDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
