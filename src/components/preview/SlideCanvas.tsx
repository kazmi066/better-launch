import React, { useEffect, useRef, useState } from "react";
import type { Slide, ProjectSettings, VideoSlide } from "../../types";
import { renderScene } from "../../lib/scene";
import {
  ensureImageLoaded,
  getOrCreateVideo,
  waitForVideoReady,
} from "../../lib/media-cache";

interface Props {
  slide: Slide | null;
  localTime: number;
  settings: ProjectSettings;
  isPlaying: boolean;
}

function clampToTrim(absVideoTime: number, slide: VideoSlide): number {
  const lo = Math.max(0, slide.trimStart);
  const hi = slide.trimEnd > 0 ? slide.trimEnd : absVideoTime;
  if (absVideoTime < lo) return lo;
  if (absVideoTime > hi) return hi;
  return absVideoTime;
}

export const SlideCanvas: React.FC<Props> = ({
  slide,
  localTime,
  settings,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tickRef = useRef(0);
  // Bumps when a slide's async resource finishes loading. Listed as a
  // dep on the paint effect so the canvas repaints once the asset is
  // available — the previous `useReducer` counter wasn't a dep so
  // freshly-loaded images silently failed to repaint.
  const [assetReadyTick, setAssetReadyTick] = useState(0);

  useEffect(() => {
    if (!slide) return;
    let cancelled = false;
    const triggerIfAlive = () => {
      if (!cancelled) setAssetReadyTick((x) => x + 1);
    };

    if (slide.type === "standard") {
      if (slide.backgroundType === "image" && slide.backgroundImageUrl) {
        ensureImageLoaded(slide.backgroundImageUrl)
          .then(triggerIfAlive)
          .catch(() => {});
      }
      if (slide.backgroundType === "video" && slide.backgroundVideoUrl) {
        const v = getOrCreateVideo(slide.backgroundVideoUrl);
        v.loop = true;
        v.muted = true;
        waitForVideoReady(v)
          .then(triggerIfAlive)
          .catch(() => {});
      }
    }

    if (slide.type === "video" && slide.videoUrl) {
      const v = getOrCreateVideo(slide.videoUrl);
      waitForVideoReady(v)
        .then(triggerIfAlive)
        .catch(() => {});
    }

    if (slide.type === "logo" && slide.logoImageUrl) {
      ensureImageLoaded(slide.logoImageUrl)
        .then(triggerIfAlive)
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [
    slide?.type,
    slide?.type === "standard" ? slide.backgroundType : null,
    slide?.type === "standard" ? slide.backgroundImageUrl : null,
    slide?.type === "standard" ? slide.backgroundVideoUrl : null,
    slide?.type === "video" ? slide.videoUrl : null,
    slide?.type === "logo" ? slide.logoImageUrl : null,
  ]);

  useEffect(() => {
    if (!slide) return;

    if (slide.type === "standard") {
      if (slide.backgroundType === "video" && slide.backgroundVideoUrl) {
        const v = getOrCreateVideo(slide.backgroundVideoUrl);
        if (isPlaying) v.play().catch(() => {});
        else v.pause();
      }
    }

    if (slide.type === "video" && slide.videoUrl) {
      const v = getOrCreateVideo(slide.videoUrl);
      if (isPlaying) {
        // Re-anchor to the trim window before playing so a fresh play
        // never picks up wherever the video element happened to be left.
        if (v.duration && Number.isFinite(v.duration)) {
          const target = clampToTrim(slide.trimStart + localTime, slide);
          if (Math.abs(v.currentTime - target) > 0.05) v.currentTime = target;
        }
        v.play().catch(() => {});
      } else {
        v.pause();
        if (v.duration && Number.isFinite(v.duration)) {
          v.currentTime = clampToTrim(slide.trimStart + localTime, slide);
        }
      }
    }
  }, [
    isPlaying,
    slide?.type,
    slide?.type === "standard" ? slide.backgroundType : null,
    slide?.type === "standard" ? slide.backgroundVideoUrl : null,
    slide?.type === "video" ? slide.videoUrl : null,
    slide?.type === "video" ? slide.trimStart : null,
    slide?.type === "video" ? slide.trimEnd : null,
  ]);

  useEffect(() => {
    if (!slide || slide.type !== "video" || !slide.videoUrl) return;
    if (isPlaying) return;
    const v = getOrCreateVideo(slide.videoUrl);
    if (!v.duration || !Number.isFinite(v.duration)) return;
    v.currentTime = clampToTrim(slide.trimStart + localTime, slide);
  }, [
    localTime,
    isPlaying,
    slide?.type,
    slide?.type === "video" ? slide.videoUrl : null,
    slide?.type === "video" ? slide.trimStart : null,
    slide?.type === "video" ? slide.trimEnd : null,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = { width: settings.width, height: settings.height };
    if (canvas.width !== size.width) canvas.width = size.width;
    if (canvas.height !== size.height) canvas.height = size.height;

    const paint = () => {
      renderScene(ctx, slide, localTime, size);
    };

    paint();

    // When a video source is playing we need per-frame drawImage so
    // the canvas reflects the moving video.
    const hasLiveVideo =
      !!slide &&
      isPlaying &&
      ((slide.type === "standard" &&
        slide.backgroundType === "video" &&
        !!slide.backgroundVideoUrl) ||
        (slide.type === "video" && !!slide.videoUrl));

    if (hasLiveVideo) {
      const loop = () => {
        paint();
        tickRef.current = requestAnimationFrame(loop);
      };
      tickRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(tickRef.current);
    }

    let videoEl: HTMLVideoElement | null = null;
    if (slide?.type === "video" && slide.videoUrl) {
      videoEl = getOrCreateVideo(slide.videoUrl);
    } else if (
      slide?.type === "standard" &&
      slide.backgroundType === "video" &&
      slide.backgroundVideoUrl
    ) {
      videoEl = getOrCreateVideo(slide.backgroundVideoUrl);
    }

    if (videoEl) {
      const v = videoEl;
      const repaint = () => paint();
      v.addEventListener("seeked", repaint);
      v.addEventListener("loadeddata", repaint);
      v.addEventListener("canplay", repaint);
      return () => {
        v.removeEventListener("seeked", repaint);
        v.removeEventListener("loadeddata", repaint);
        v.removeEventListener("canplay", repaint);
      };
    }
  }, [
    slide,
    localTime,
    settings.width,
    settings.height,
    isPlaying,
    assetReadyTick,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
};
