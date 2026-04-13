import React, { forwardRef } from "react";
import { useProjectStore } from "../store";
import { getActiveSlide } from "../engine/renderer";
import { StandardSlidePreview } from "./preview/StandardSlidePreview";
import { VideoSlidePreview } from "./preview/VideoSlidePreview";

const PREVIEW_REFERENCE_WIDTH = 960;

export const ExportRenderer = forwardRef<HTMLDivElement>((_props, ref) => {
  const slides = useProjectStore((s) => s.slides);
  const settings = useProjectStore((s) => s.settings);
  const currentTime = useProjectStore((s) => s.currentTime);

  const active = getActiveSlide(slides, currentTime);
  const exportScale = settings.width / PREVIEW_REFERENCE_WIDTH;

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: "-99999px",
        top: 0,
        width: settings.width,
        height: settings.height,
        overflow: "hidden",
        background: "#000000",
      }}>
      {active && active.slide.type === "standard" && (
        <StandardSlidePreview
          key={active.slide.id}
          slide={active.slide}
          progress={active.localProgress}
          isExporting
          exportScale={exportScale}
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
