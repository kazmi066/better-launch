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
import { Playhead } from "./preview/Playhead";
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
  const scrubbingRef = useRef(false);
  const totalDurationRef = useRef(0);

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
  totalDurationRef.current = totalDuration;
  const shownTime = Math.min(Math.max(currentTime, 0), totalDuration);
  const active = getActiveSlide(slides, shownTime);

  const tick = useCallback(() => {
    const store = useProjectStore.getState();

    // A queued frame can still run after the user grabs the playhead.
    // Playback must not move the time out from under that gesture.
    if (scrubbingRef.current) {
      lastTickRef.current = performance.now();
      if (store.isPlaying) rafRef.current = requestAnimationFrame(tick);
      return;
    }
    if (!store.isPlaying) return;

    const now = performance.now();
    const delta = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;

    const total = totalDurationRef.current;
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

  const commitTime = useCallback((time: number) => {
    const store = useProjectStore.getState();
    // Keyboard and other one-shot seeks are not inside a drag, so they
    // have to pause here. A drag already paused when it started.
    if (!scrubbingRef.current && store.isPlaying) store.setIsPlaying(false);
    if (!Number.isFinite(time)) return;
    const total = Math.max(0, totalDurationRef.current);
    const next = Math.min(Math.max(0, time), total);
    if (Object.is(next, store.currentTime)) return;
    store.setCurrentTime(next);
  }, []);

  const onScrubbingChange = useCallback((scrubbing: boolean) => {
    scrubbingRef.current = scrubbing;
    lastTickRef.current = performance.now();
    if (!scrubbing) return;
    cancelAnimationFrame(rafRef.current);
    const store = useProjectStore.getState();
    if (store.isPlaying) store.setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (currentTime > totalDuration) setCurrentTime(totalDuration);
    else if (currentTime < 0 || !Number.isFinite(currentTime)) setCurrentTime(0);
  }, [currentTime, totalDuration, setCurrentTime]);

  useImperativeHandle(ref, () => ({
    play: () => {
      const store = useProjectStore.getState();
      if (store.currentTime >= totalDurationRef.current) {
        store.setCurrentTime(0);
      }
      store.setIsPlaying(true);
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
            className="relative overflow-hidden rounded-xl border border-white/10 bg-black shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
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
                {formatTime(Math.round(shownTime * settings.fps), settings.fps)}
              </span>
              <Playhead
                currentTime={shownTime}
                duration={totalDuration}
                fps={settings.fps}
                onSeek={commitTime}
                onNudge={(delta) =>
                  commitTime(useProjectStore.getState().currentTime + delta)
                }
                onScrubbingChange={onScrubbingChange}
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
