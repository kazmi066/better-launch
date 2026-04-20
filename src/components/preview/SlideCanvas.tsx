import React, { useEffect, useRef } from "react";
import type { Slide, ProjectSettings } from "../../types";
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

// Canvas backing-store is the project's native resolution
// (e.g. 1920×1080). We only CSS-scale to fit the UI, so preview and
// export go through the exact same renderScene pixels.
export const SlideCanvas: React.FC<Props> = ({
  slide,
  localTime,
  settings,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tickRef = useRef(0);
  const [, forceRender] = React.useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    if (!slide) return;

    if (slide.type === "standard") {
      if (slide.backgroundType === "image" && slide.backgroundImageUrl) {
        let cancelled = false;
        ensureImageLoaded(slide.backgroundImageUrl)
          .then(() => {
            if (!cancelled) forceRender();
          })
          .catch(() => {});
        return () => {
          cancelled = true;
        };
      }
      if (slide.backgroundType === "video" && slide.backgroundVideoUrl) {
        const v = getOrCreateVideo(slide.backgroundVideoUrl);
        v.loop = true;
        v.muted = true;
        waitForVideoReady(v)
          .then(() => forceRender())
          .catch(() => {});
      }
    }

    if (slide.type === "video" && slide.videoUrl) {
      const v = getOrCreateVideo(slide.videoUrl);
      waitForVideoReady(v)
        .then(() => forceRender())
        .catch(() => {});
    }
  }, [
    slide?.type,
    slide?.type === "standard" ? slide.backgroundType : null,
    slide?.type === "standard" ? slide.backgroundImageUrl : null,
    slide?.type === "standard" ? slide.backgroundVideoUrl : null,
    slide?.type === "video" ? slide.videoUrl : null,
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
        v.play().catch(() => {});
      } else {
        v.pause();
        if (v.duration && Number.isFinite(v.duration)) {
          v.currentTime = Math.max(0, Math.min(localTime, v.duration));
        }
      }
    }
  }, [
    isPlaying,
    slide?.type,
    slide?.type === "standard" ? slide.backgroundType : null,
    slide?.type === "standard" ? slide.backgroundVideoUrl : null,
    slide?.type === "video" ? slide.videoUrl : null,
  ]);

  useEffect(() => {
    if (!slide || slide.type !== "video" || !slide.videoUrl) return;
    if (isPlaying) return;
    const v = getOrCreateVideo(slide.videoUrl);
    if (!v.duration || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.max(0, Math.min(localTime, v.duration));
  }, [
    localTime,
    isPlaying,
    slide?.type,
    slide?.type === "video" ? slide.videoUrl : null,
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
  }, [slide, localTime, settings.width, settings.height, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
};
