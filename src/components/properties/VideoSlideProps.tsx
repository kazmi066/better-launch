import React, { useCallback, useMemo } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { useProjectStore } from "../../store";
import type { VideoSlide } from "../../types";
import { Upload, X, Clock, Scissors, RotateCcw } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const MIN_TRIM_DURATION = 0.5;
const TRIM_STEP = 0.1;

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

function probeVideoDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve(video.duration);
      video.src = "";
    };
    video.onerror = () => reject(new Error("Could not read video metadata"));
    video.src = url;
  });
}

function formatSeconds(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0.0s";
  return `${s.toFixed(1)}s`;
}

const RangeSlider: React.FC<{
  min: number;
  max: number;
  step: number;
  minDistance: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}> = ({ min, max, step, minDistance, value, onChange }) => {
  const handleChange = useCallback(
    (next: number[]) => {
      const a = next[0] ?? min;
      const b = next[1] ?? max;
      // Enforce a minimum gap between the two thumbs so the slide can
      // never collapse to zero (or negative) duration.
      let lo = Math.min(a, b);
      let hi = Math.max(a, b);
      if (hi - lo < minDistance) {
        if (lo === value[0]) {
          hi = Math.min(max, lo + minDistance);
        } else {
          lo = Math.max(min, hi - minDistance);
        }
      }
      onChange([lo, hi]);
    },
    [min, max, minDistance, onChange, value],
  );

  return (
    <SliderPrimitive.Root
      min={min}
      max={max}
      step={step}
      minStepsBetweenThumbs={Math.max(1, Math.round(minDistance / step))}
      value={value}
      onValueChange={handleChange}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
      )}>
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label="Trim start"
        className="block h-4 w-4 rounded-full border border-border bg-foreground shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      />
      <SliderPrimitive.Thumb
        aria-label="Trim end"
        className="block h-4 w-4 rounded-full border border-border bg-foreground shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      />
    </SliderPrimitive.Root>
  );
};

export const VideoSlideProps: React.FC<{ slide: VideoSlide }> = ({ slide }) => {
  const updateSlide = useProjectStore((s) => s.updateSlide);
  const slides = useProjectStore((s) => s.slides);
  const setCurrentTime = useProjectStore((s) => s.setCurrentTime);
  const setIsPlaying = useProjectStore((s) => s.setIsPlaying);

  const u = useCallback(
    (patch: Partial<VideoSlide>) => updateSlide(slide.id, patch),
    [updateSlide, slide.id],
  );

  // Global start time of this slide (sum of preceding slides' durations).
  // Used to drive the preview to the new trim point as the user drags.
  const slideStartTime = useMemo(() => {
    let acc = 0;
    for (const s of slides) {
      if (s.id === slide.id) break;
      acc += s.durationSeconds;
    }
    return acc;
  }, [slides, slide.id]);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputEl = e.target;
      const file = inputEl.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      try {
        const rawDuration = await probeVideoDuration(url);
        const duration = Math.round(rawDuration * 10) / 10;
        u({
          videoUrl: url,
          videoFileName: file.name,
          sourceDurationSeconds: duration,
          trimStart: 0,
          trimEnd: duration,
          durationSeconds: duration,
        });
      } catch {
        u({
          videoUrl: url,
          videoFileName: file.name,
          sourceDurationSeconds: 0,
          trimStart: 0,
          trimEnd: 0,
          durationSeconds: 0,
        });
      }
      inputEl.value = "";
    },
    [u],
  );

  const handleClear = useCallback(() => {
    u({
      videoUrl: "",
      videoFileName: "",
      sourceDurationSeconds: 0,
      trimStart: 0,
      trimEnd: 0,
      durationSeconds: 0,
    });
  }, [u]);

  const sourceDuration = slide.sourceDurationSeconds;
  const canTrim = sourceDuration > MIN_TRIM_DURATION;
  const trimmedDuration = Math.max(0, slide.trimEnd - slide.trimStart);

  const handleTrimChange = useCallback(
    ([nextStart, nextEnd]: [number, number]) => {
      const start = Math.max(0, Math.min(nextStart, sourceDuration));
      const end = Math.max(
        start + MIN_TRIM_DURATION,
        Math.min(nextEnd, sourceDuration),
      );
      const nextDuration = Math.round((end - start) * 10) / 10;

      u({
        trimStart: Math.round(start * 10) / 10,
        trimEnd: Math.round(end * 10) / 10,
        durationSeconds: nextDuration,
      });

      // Snap the global timeline to the edited edge so the preview
      // shows the new in/out frame immediately. Pause first so the
      // seek isn't fought by the playback loop.
      setIsPlaying(false);
      const movedStart = Math.abs(nextStart - slide.trimStart) > 1e-3;
      const previewLocal = movedStart ? 0 : Math.max(0, nextDuration - 0.05);
      setCurrentTime(slideStartTime + previewLocal);
    },
    [
      sourceDuration,
      u,
      setIsPlaying,
      setCurrentTime,
      slideStartTime,
      slide.trimStart,
    ],
  );

  const handleResetTrim = useCallback(() => {
    if (sourceDuration <= 0) return;
    u({
      trimStart: 0,
      trimEnd: sourceDuration,
      durationSeconds: sourceDuration,
    });
    setIsPlaying(false);
    setCurrentTime(slideStartTime);
  }, [sourceDuration, u, setIsPlaying, setCurrentTime, slideStartTime]);

  return (
    <div className="space-y-5">
      <Field label="Label">
        <Input
          value={slide.label}
          onChange={(e) => u({ label: e.target.value })}
          placeholder="Video Clip"
        />
      </Field>

      <Field label="Video File">
        <div className="flex items-center gap-2">
          <label className="flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-dashed border-input hover:border-foreground/30 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground truncate text-xs">
              {slide.videoFileName || "Browse video (.mp4, .mov, .webm ...)"}
            </span>
            <input
              type="file"
              accept=".mp4,.mov,.webm,.avi,.mkv,.m4v,.ogv"
              onChange={handleFile}
              className="hidden"
            />
          </label>
          {slide.videoFileName && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </Field>

      {canTrim && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5" />
              Trim
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetTrim}
              disabled={
                slide.trimStart === 0 && slide.trimEnd === sourceDuration
              }
              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1">
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>

          <RangeSlider
            min={0}
            max={sourceDuration}
            step={TRIM_STEP}
            minDistance={MIN_TRIM_DURATION}
            value={[slide.trimStart, slide.trimEnd]}
            onChange={handleTrimChange}
          />

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="bg-secondary rounded-md px-2 py-1.5">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                Start
              </p>
              <p className="text-foreground font-medium tabular-nums">
                {formatSeconds(slide.trimStart)}
              </p>
            </div>
            <div className="bg-secondary rounded-md px-2 py-1.5">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                End
              </p>
              <p className="text-foreground font-medium tabular-nums">
                {formatSeconds(slide.trimEnd)}
              </p>
            </div>
            <div className="bg-secondary rounded-md px-2 py-1.5">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                Length
              </p>
              <p className="text-foreground font-medium tabular-nums">
                {formatSeconds(trimmedDuration)}
              </p>
            </div>
          </div>
        </div>
      )}

      {slide.durationSeconds > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
          <Clock className="w-3.5 h-3.5" />
          <span>
            Source:{" "}
            <strong className="text-foreground">
              {formatSeconds(sourceDuration || slide.durationSeconds)}
            </strong>
            {sourceDuration > 0 && trimmedDuration < sourceDuration && (
              <>
                {" · "}
                Trimmed to{" "}
                <strong className="text-foreground">
                  {formatSeconds(trimmedDuration)}
                </strong>
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
};
