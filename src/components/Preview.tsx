import React, {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useProjectStore } from "../store";
import { getActiveSlide } from "../engine/renderer";
import { SlideCanvas } from "./preview/SlideCanvas";
import { formatTime } from "../lib/utils";

export interface PreviewHandle {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
}

export const Preview = forwardRef<PreviewHandle>((_props, ref) => {
  const slides = useProjectStore((s) => s.slides);
  const settings = useProjectStore((s) => s.settings);
  const currentTime = useProjectStore((s) => s.currentTime);
  const setCurrentTime = useProjectStore((s) => s.setCurrentTime);
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const setIsPlaying = useProjectStore((s) => s.setIsPlaying);
  const audioTrack = useProjectStore((s) => s.audioTrack);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  // Keep volume in sync whenever the user drags the slider.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !audioTrack) return;
    a.volume = audioTrack.volume;
    a.loop = true;
  }, [audioTrack?.volume, audioTrack?.url]);

  // Play / pause follows the timeline. We re-sync currentTime on every
  // play start so the user hears from the correct spot after scrubbing.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !audioTrack || audioTrack.duration <= 0) return;
    if (isPlaying) {
      const t = useProjectStore.getState().currentTime % audioTrack.duration;
      a.currentTime = t;
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [isPlaying, audioTrack?.url, audioTrack?.duration]);

  // Keep audio position locked to timeline seeks/restarts. While
  // playing we only snap on larger drift to avoid fighting the media
  // clock every frame.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !audioTrack || audioTrack.duration <= 0) return;
    const target = currentTime % audioTrack.duration;
    const threshold = isPlaying ? 0.2 : 0.05;
    if (Math.abs(a.currentTime - target) > threshold) a.currentTime = target;
  }, [currentTime, isPlaying, audioTrack?.url, audioTrack?.duration]);

  const totalDuration = slides.reduce((sum, s) => {
    if (s.type === "standard" || s.type === "logo") {
      return sum + s.durationSeconds + s.delaySeconds;
    }
    return sum + s.durationSeconds;
  }, 0);
  const active = getActiveSlide(slides, currentTime);

  const tick = useCallback(() => {
    const now = performance.now();
    const delta = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;

    const store = useProjectStore.getState();
    const total = store.slides.reduce((sum, s) => {
      if (s.type === "standard" || s.type === "logo") {
        return sum + s.durationSeconds + s.delaySeconds;
      }
      return sum + s.durationSeconds;
    }, 0);
    const next = store.currentTime + delta;

    if (next >= total) {
      store.setCurrentTime(total);
      store.setIsPlaying(false);
      return;
    }

    store.setCurrentTime(next);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, tick]);

  useImperativeHandle(ref, () => ({
    play: () => {
      if (currentTime >= totalDuration) {
        setCurrentTime(0);
      }
      setIsPlaying(true);
    },
    pause: () => setIsPlaying(false),
    seekTo: (seconds: number) => setCurrentTime(seconds),
  }));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col min-w-0">
      {audioTrack && (
        <audio
          ref={audioRef}
          src={audioTrack.url}
          preload="auto"
          className="hidden"
        />
      )}
      <div className="flex h-13 shrink-0 items-center justify-between border-b border-border/70 px-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground/85">
            Preview
          </span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
          <span className="text-xs capitalize text-muted-foreground">
            {active
              ? `${active.slide.type === "standard" ? "title" : active.slide.type} scene`
              : "No scene"}
          </span>
        </div>
        <span className="rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs tabular-nums text-muted-foreground">
          {settings.width} × {settings.height}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto p-6 lg:p-8">
        <div className="w-full max-w-4xl">
          <div
            className="relative overflow-hidden rounded-[14px] border border-[#303137] bg-black shadow-[0_28px_90px_rgba(0,0,0,0.36),0_0_0_1px_rgba(255,255,255,0.015)]"
            style={{
              aspectRatio: `${settings.width} / ${settings.height}`,
            }}>
            <div
              ref={containerRef}
              className="absolute inset-0"
              style={{ width: "100%", height: "100%" }}>
              <SlideCanvas
                slides={slides}
                currentTime={currentTime}
                settings={settings}
                isPlaying={isPlaying}
              />
              {!active && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground pointer-events-none">
                  Add a scene to begin your story
                </div>
              )}
            </div>
          </div>

          {totalDuration > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                {formatTime(
                  Math.round(currentTime * settings.fps),
                  settings.fps,
                )}
              </span>
              <input
                type="range"
                min={0}
                max={totalDuration}
                step={0.01}
                value={currentTime}
                onChange={(e) => setCurrentTime(Number(e.target.value))}
                aria-label="Video playhead"
                className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-secondary accent-brand [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0d0e10] [&::-webkit-slider-thumb]:bg-brand"
              />
              <span className="w-12 text-xs text-muted-foreground tabular-nums">
                {formatTime(
                  Math.round(totalDuration * settings.fps),
                  settings.fps,
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Preview.displayName = "Preview";
