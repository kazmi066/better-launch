import React, { useEffect, useRef, useState } from "react";
import type { Slide, ProjectSettings, VideoSlide } from "../../types";
import { getTimelineFrame } from "../../engine/renderer";
import { renderTimelineFrame } from "../../lib/timeline-renderer";
import {
  ensureImageLoaded,
  getOrCreateVideo,
  waitForVideoReady,
} from "../../lib/media-cache";

interface Props {
  slides: Slide[];
  currentTime: number;
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

function getSlideVideo(slide: Slide | null): HTMLVideoElement | null {
  if (!slide) return null;
  if (
    slide.type === "standard" &&
    slide.backgroundType === "video" &&
    slide.backgroundVideoUrl
  ) {
    const video = getOrCreateVideo(slide.backgroundVideoUrl, slide.id);
    video.loop = true;
    video.muted = true;
    return video;
  }
  if (slide.type === "video" && slide.videoUrl) {
    return getOrCreateVideo(slide.videoUrl, slide.id);
  }
  return null;
}

function seekSlideVideo(
  slide: Slide,
  localTime: number,
  fps: number,
  holdLastFrame: boolean,
) {
  const video = getSlideVideo(slide);
  if (!video || !video.duration || !Number.isFinite(video.duration)) return;

  const frameOffset = holdLastFrame ? 1 / fps : 0;
  if (slide.type === "standard") {
    video.currentTime =
      Math.max(0, localTime - frameOffset) % Math.max(video.duration, 0.001);
    return;
  }

  if (slide.type === "video") {
    const requested = clampToTrim(slide.trimStart + localTime, slide);
    const trimEnd = slide.trimEnd > 0 ? slide.trimEnd : video.duration;
    video.currentTime = Math.min(
      requested,
      Math.max(slide.trimStart, trimEnd - frameOffset),
    );
  }
}

export const SlideCanvas: React.FC<Props> = ({
  slides,
  currentTime,
  settings,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tickRef = useRef(0);
  const [assetReadyTick, setAssetReadyTick] = useState(0);

  const frame = getTimelineFrame(slides, currentTime);
  const activeSlide = frame.active?.slide ?? null;
  const activeLocalTime = frame.active?.localTime ?? 0;
  const previousSlide = frame.previous?.slide ?? null;
  const previousLocalTime = frame.previous?.localTime ?? 0;
  const activeLocalTimeRef = useRef(activeLocalTime);
  activeLocalTimeRef.current = activeLocalTime;

  // Load resources for both halves of a transition before repainting.
  useEffect(() => {
    const targetSlides = [activeSlide, previousSlide].filter(
      (slide, index, all): slide is Slide =>
        !!slide && all.findIndex((candidate) => candidate?.id === slide.id) === index,
    );
    if (targetSlides.length === 0) return;

    let cancelled = false;
    const triggerIfAlive = () => {
      if (!cancelled) setAssetReadyTick((tick) => tick + 1);
    };

    for (const slide of targetSlides) {
      if (slide.type === "standard") {
        if (slide.backgroundType === "image" && slide.backgroundImageUrl) {
          ensureImageLoaded(slide.backgroundImageUrl)
            .then(triggerIfAlive)
            .catch(() => {});
        }
        if (slide.backgroundType === "video" && slide.backgroundVideoUrl) {
          const video = getOrCreateVideo(slide.backgroundVideoUrl, slide.id);
          video.loop = true;
          video.muted = true;
          waitForVideoReady(video).then(triggerIfAlive).catch(() => {});
        }
      }

      if (slide.type === "video" && slide.videoUrl) {
        const video = getOrCreateVideo(slide.videoUrl, slide.id);
        waitForVideoReady(video).then(triggerIfAlive).catch(() => {});
      }

      if (slide.type === "logo" && slide.logoImageUrl) {
        ensureImageLoaded(slide.logoImageUrl)
          .then(triggerIfAlive)
          .catch(() => {});
      }
    }

    return () => {
      cancelled = true;
    };
  }, [activeSlide, previousSlide]);

  // Only the incoming scene can play video during a transition. The outgoing
  // scene is held on its final full-quality frame.
  useEffect(() => {
    const activeVideo = getSlideVideo(activeSlide);
    const previousVideo = getSlideVideo(previousSlide);

    if (previousVideo && previousVideo !== activeVideo) previousVideo.pause();

    if (!activeVideo || !activeSlide) return;
    if (isPlaying) {
      if (activeSlide.type === "video") {
        seekSlideVideo(
          activeSlide,
          activeLocalTimeRef.current,
          settings.fps,
          false,
        );
      }
      activeVideo.play().catch(() => {});
    } else {
      activeVideo.pause();
    }
  }, [
    isPlaying,
    activeSlide,
    previousSlide,
    settings.fps,
  ]);

  // Scrubbing and paused previews seek both buffers to deterministic frames.
  useEffect(() => {
    if (isPlaying) return;
    if (activeSlide) {
      seekSlideVideo(activeSlide, activeLocalTime, settings.fps, false);
    }
    if (previousSlide) {
      seekSlideVideo(previousSlide, previousLocalTime, settings.fps, true);
    }
  }, [
    activeSlide,
    activeLocalTime,
    previousSlide,
    previousLocalTime,
    isPlaying,
    settings.fps,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = { width: settings.width, height: settings.height };
    if (canvas.width !== size.width) canvas.width = size.width;
    if (canvas.height !== size.height) canvas.height = size.height;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const paint = () => {
      renderTimelineFrame(ctx, slides, currentTime, size);
    };

    paint();

    const activeVideo = getSlideVideo(activeSlide);
    if (activeVideo && isPlaying) {
      const loop = () => {
        paint();
        tickRef.current = requestAnimationFrame(loop);
      };
      tickRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(tickRef.current);
    }

    const videoElements = [activeVideo, getSlideVideo(previousSlide)].filter(
      (video, index, all): video is HTMLVideoElement =>
        !!video && all.indexOf(video) === index,
    );

    if (videoElements.length > 0) {
      const repaint = () => paint();
      for (const video of videoElements) {
        video.addEventListener("seeked", repaint);
        video.addEventListener("loadeddata", repaint);
        video.addEventListener("canplay", repaint);
      }
      return () => {
        for (const video of videoElements) {
          video.removeEventListener("seeked", repaint);
          video.removeEventListener("loadeddata", repaint);
          video.removeEventListener("canplay", repaint);
        }
      };
    }
  }, [
    slides,
    currentTime,
    activeSlide,
    previousSlide,
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
