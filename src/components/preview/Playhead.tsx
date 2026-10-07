import React, { useEffect, useRef, useState } from "react";
import { cn, formatTime } from "../../lib/utils";

interface PlayheadProps {
  currentTime: number;
  duration: number;
  fps: number;
  onSeek: (time: number) => void;
  onNudge: (deltaSeconds: number) => void;
  onScrubbingChange: (scrubbing: boolean) => void;
}

function timeAtClientX(
  clientX: number,
  rect: DOMRect,
  duration: number,
): number | null {
  if (rect.width <= 0 || !(duration > 0)) return null;
  const ratio = (clientX - rect.left) / rect.width;
  if (ratio <= 0) return 0;
  if (ratio >= 1) return duration;
  return ratio * duration;
}

export const Playhead: React.FC<PlayheadProps> = ({
  currentTime,
  duration,
  fps,
  onSeek,
  onNudge,
  onScrubbingChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const lastXRef = useRef(0);
  const moveRafRef = useRef(0);
  const pendingXRef = useRef<number | null>(null);
  const durationRef = useRef(duration);
  const onScrubbingChangeRef = useRef(onScrubbingChange);
  const detachWindowRef = useRef<(() => void) | null>(null);
  const [dragging, setDragging] = useState(false);

  durationRef.current = duration;
  onScrubbingChangeRef.current = onScrubbingChange;

  const seekFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const time = timeAtClientX(
      clientX,
      el.getBoundingClientRect(),
      durationRef.current,
    );
    if (time === null) return;
    onSeek(time);
  };

  const cancelPendingMove = () => {
    cancelAnimationFrame(moveRafRef.current);
    moveRafRef.current = 0;
    pendingXRef.current = null;
  };

  const finishDrag = (clientX: number) => {
    if (pointerIdRef.current === null) return;
    pointerIdRef.current = null;
    detachWindowRef.current?.();
    detachWindowRef.current = null;
    setDragging(false);
    cancelPendingMove();
    seekFromClientX(clientX);
    onScrubbingChange(false);
  };

  const finishDragRef = useRef(finishDrag);
  finishDragRef.current = finishDrag;

  useEffect(() => {
    return () => {
      cancelAnimationFrame(moveRafRef.current);
      detachWindowRef.current?.();
      detachWindowRef.current = null;
      if (pointerIdRef.current !== null) {
        pointerIdRef.current = null;
        onScrubbingChangeRef.current(false);
      }
    };
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || pointerIdRef.current !== null) return;
    event.preventDefault();
    pointerIdRef.current = event.pointerId;
    lastXRef.current = event.clientX;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer can already be gone. Window listeners still finish the drag.
    }

    const pointerId = event.pointerId;
    const onWindowUp = (windowEvent: PointerEvent) => {
      if (windowEvent.pointerId !== pointerId) return;
      finishDragRef.current(windowEvent.clientX);
    };
    const onWindowBlur = () => {
      if (pointerIdRef.current !== pointerId) return;
      finishDragRef.current(lastXRef.current);
    };
    window.addEventListener("pointerup", onWindowUp);
    window.addEventListener("pointercancel", onWindowUp);
    window.addEventListener("blur", onWindowBlur);
    detachWindowRef.current = () => {
      window.removeEventListener("pointerup", onWindowUp);
      window.removeEventListener("pointercancel", onWindowUp);
      window.removeEventListener("blur", onWindowBlur);
    };

    trackRef.current?.focus({ preventScroll: true });
    setDragging(true);
    onScrubbingChange(true);
    seekFromClientX(event.clientX);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== pointerIdRef.current) return;
    lastXRef.current = event.clientX;
    pendingXRef.current = event.clientX;
    if (moveRafRef.current) return;
    moveRafRef.current = requestAnimationFrame(() => {
      moveRafRef.current = 0;
      const clientX = pendingXRef.current;
      pendingXRef.current = null;
      if (clientX === null || pointerIdRef.current === null) return;
      seekFromClientX(clientX);
    });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== pointerIdRef.current) return;
    const clientX = event.clientX;
    // Drop the id before releasing capture. Otherwise lostpointercapture
    // runs inside releasePointerCapture and seeks with a 0,0 event.
    finishDrag(clientX);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onLostPointerCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== pointerIdRef.current) return;
    finishDrag(lastXRef.current);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const frame = 1 / Math.max(1, fps);
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      onNudge(direction * (event.shiftKey ? 1 : frame));
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      onSeek(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      onSeek(durationRef.current);
    }
  };

  const progress =
    duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const shown = Math.min(Math.max(currentTime, 0), Math.max(duration, 0));
  const expanded = dragging;

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label="Video playhead"
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration * fps)}
      aria-valuenow={Math.round(shown * fps)}
      aria-valuetext={`${formatTime(Math.round(shown * fps), fps)} of ${formatTime(Math.round(duration * fps), fps)}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={onLostPointerCapture}
      onKeyDown={onKeyDown}
      className={cn(
        "group relative flex h-8 min-w-0 flex-1 touch-none select-none items-center outline-none",
        expanded ? "cursor-grabbing" : "cursor-pointer",
      )}>
      <div
        className={cn(
          "relative w-full rounded-full bg-secondary group-focus-visible:ring-2 group-focus-visible:ring-ring",
          expanded ? "h-1.5" : "h-1 group-hover:h-1.5",
        )}>
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-foreground"
          style={{ width: `${progress * 100}%` }}
        />
        <div
          className={cn(
            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-foreground",
            expanded
              ? "h-3.5 w-3.5"
              : "h-3 w-3 group-hover:h-3.5 group-hover:w-3.5",
          )}
          style={{ left: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
};
