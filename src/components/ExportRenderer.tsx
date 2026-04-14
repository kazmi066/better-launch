import React, { forwardRef } from "react";
import { useProjectStore } from "../store";
import { getActiveSlide } from "../engine/renderer";
import { StandardSlidePreview } from "./preview/StandardSlidePreview";
import { VideoSlidePreview } from "./preview/VideoSlidePreview";

const LOGICAL_REFERENCE_SIZE = 960;

export const ExportRenderer = forwardRef<HTMLDivElement>((_props, ref) => {
  const slides = useProjectStore((s) => s.slides);
  const settings = useProjectStore((s) => s.settings);
  const currentTime = useProjectStore((s) => s.currentTime);

  const active = getActiveSlide(slides, currentTime);
  const isLandscape = settings.width >= settings.height;
  const logicalWidth = isLandscape
    ? LOGICAL_REFERENCE_SIZE
    : (LOGICAL_REFERENCE_SIZE * settings.width) / settings.height;
  const logicalHeight = isLandscape
    ? (LOGICAL_REFERENCE_SIZE * settings.height) / settings.width
    : LOGICAL_REFERENCE_SIZE;

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: logicalWidth,
        height: logicalHeight,
        overflow: "hidden",
        background: "#000000",
        pointerEvents: "none",
        zIndex: -1,
      }}>
      {active && active.slide.type === "standard" && (
        <StandardSlidePreview
          key={active.slide.id}
          slide={active.slide}
          progress={active.localProgress}
          isExporting
        />
      )}
      {active && active.slide.type === "video" && (
        <VideoSlidePreview
          key={active.slide.id}
          slide={active.slide}
          progress={active.localProgress}
          isPlaying={false}
          isExporting
        />
      )}
    </div>
  );
});

ExportRenderer.displayName = "ExportRenderer";
