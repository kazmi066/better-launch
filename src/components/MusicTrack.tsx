import React, { useRef, useState } from "react";
import { Music, X, Loader2, Upload, Volume2 } from "lucide-react";
import { useProjectStore } from "../store";
import { decodeAudioFile, formatAudioDuration } from "../lib/audio";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { cn } from "../lib/utils";

function Waveform({
  peaks,
  progress,
  className,
}: {
  peaks: number[];
  progress: number;
  className?: string;
}) {
  const count = peaks.length;
  return (
    <svg
      viewBox={`0 0 ${count} 100`}
      preserveAspectRatio="none"
      className={cn("w-full h-full", className)}>
      <defs>
        <clipPath id="mt-played">
          <rect x={0} y={0} width={count * progress} height={100} />
        </clipPath>
      </defs>

      <g fill="currentColor" className="text-muted-foreground/40">
        {peaks.map((p, i) => {
          const h = Math.max(2, p * 96);
          return (
            <rect
              key={i}
              x={i + 0.1}
              y={50 - h / 2}
              width={0.8}
              height={h}
              rx={0.2}
            />
          );
        })}
      </g>

      <g
        fill="currentColor"
        className="text-brand"
        clipPath="url(#mt-played)">
        {peaks.map((p, i) => {
          const h = Math.max(2, p * 96);
          return (
            <rect
              key={`p${i}`}
              x={i + 0.1}
              y={50 - h / 2}
              width={0.8}
              height={h}
              rx={0.2}
            />
          );
        })}
      </g>
    </svg>
  );
}

export const MusicTrack: React.FC = () => {
  const audioTrack = useProjectStore((s) => s.audioTrack);
  const setAudioTrack = useProjectStore((s) => s.setAudioTrack);
  const updateAudioTrack = useProjectStore((s) => s.updateAudioTrack);
  const currentTime = useProjectStore((s) => s.currentTime);
  const totalSeconds = useProjectStore((s) => s.totalDurationSeconds());

  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const track = await decodeAudioFile(file);
      setAudioTrack(track);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't decode audio");
    } finally {
      setLoading(false);
    }
  };

  const remove = () => setAudioTrack(null);

  // Progress across the video's timeline (0..1), clamped. The
  // waveform itself always represents the full audio file; the
  // played-region highlight is what moves.
  const progress =
    audioTrack && totalSeconds > 0
      ? Math.max(0, Math.min(1, currentTime / totalSeconds))
      : 0;

  return (
    <div className="flex h-full items-center bg-transparent px-4">
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        onChange={onFile}
        className="hidden"
      />

      {!audioTrack && (
        <div className="flex w-full items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary/70">
            <Music className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </div>
          <span className="text-xs font-medium text-muted-foreground tracking-tight">
            Soundtrack
          </span>
          <span className="hidden text-xs text-muted-foreground/70 lg:inline">
            Add music to set the pace
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-lg text-sm"
            onClick={onPick}
            disabled={loading}>
            {loading ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Upload className="w-3 h-3 mr-1" />
            )}
            {loading ? "Decoding…" : "Add audio"}
          </Button>
        </div>
      )}

      {audioTrack && (
        <div className="flex w-full items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10">
            <Music className="w-3.5 h-3.5 text-brand shrink-0" />
          </div>

          <div className="flex flex-col min-w-0 max-w-[160px]">
            <span className="truncate text-sm font-medium text-foreground">
              {audioTrack.name}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatAudioDuration(audioTrack.duration)}
              {totalSeconds > audioTrack.duration && (
                <span className="ml-1 text-muted-foreground/70">· loops</span>
              )}
              {totalSeconds > 0 && totalSeconds < audioTrack.duration && (
                <span className="ml-1 text-muted-foreground/70">
                  · trimmed
                </span>
              )}
            </span>
          </div>

          <div className="flex-1 h-8 min-w-0">
            <Waveform peaks={audioTrack.waveform} progress={progress} />
          </div>

          <div className="flex items-center gap-2 shrink-0 w-32">
            <Volume2 className="w-3 h-3 text-muted-foreground" />
            <Slider
              value={[Math.round(audioTrack.volume * 100)]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) =>
                updateAudioTrack({ volume: (v[0] ?? 100) / 100 })
              }
            />
            <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
              {Math.round(audioTrack.volume * 100)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={remove}
            title="Remove music">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-1 text-xs text-destructive">{error}</div>
      )}
    </div>
  );
};
