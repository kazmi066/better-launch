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

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  const totalDuration = slides.reduce((s, sl) => s + sl.durationSeconds, 0);
  const active = getActiveSlide(slides, currentTime);

  const tick = useCallback(() => {
    const now = performance.now();
    const delta = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;

    const store = useProjectStore.getState();
    const total = store.slides.reduce((s, sl) => s + sl.durationSeconds, 0);
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
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-4xl">
          <div
            className="relative rounded-lg overflow-hidden border border-border bg-black"
            style={{
              aspectRatio: `${settings.width} / ${settings.height}`,
            }}>
            <div
              ref={containerRef}
              className="absolute inset-0"
              style={{ width: "100%", height: "100%" }}>
              <SlideCanvas
                slide={active ? active.slide : null}
                localTime={active ? active.localTime : 0}
                settings={settings}
                isPlaying={isPlaying}
              />
              {!active && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm pointer-events-none">
                  Add slides to preview your video
                </div>
              )}
            </div>
          </div>

          {totalDuration > 0 && (
            <div className="flex items-center gap-3 mt-3">
              <span className="text-[11px] text-muted-foreground tabular-nums w-12 text-right">
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
                className="flex-1 h-1.5 appearance-none bg-secondary rounded-full cursor-pointer accent-foreground [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <span className="text-[11px] text-muted-foreground tabular-nums w-12">
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
