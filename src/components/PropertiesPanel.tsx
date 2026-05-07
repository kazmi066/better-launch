import React from "react";
import { useProjectStore } from "../store";
import { Separator } from "./ui/separator";
import { StandardSlideProps } from "./properties/StandardSlideProps";
import { VideoSlideProps } from "./properties/VideoSlideProps";
import { LogoSlideProps } from "./properties/LogoSlideProps";

export const PropertiesPanel: React.FC = () => {
  const slides = useProjectStore((s) => s.slides);
  const selectedSlideId = useProjectStore((s) => s.selectedSlideId);
  const slide = slides.find((s) => s.id === selectedSlideId);

  if (!slide) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
        <p>Select a slide from the timeline to edit its properties</p>
      </div>
    );
  }

  const typeLabel: Record<string, string> = {
    standard: "Standard Slide",
    video: "Video Slide",
    logo: "Logo Slide",
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3">
        <h2 className="text-[13px] font-semibold text-foreground">
          {typeLabel[slide.type] || "Properties"}
        </h2>
        <p className="text-[11px] text-muted-foreground">Edit slide settings</p>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto p-4">
        {slide.type === "standard" && <StandardSlideProps slide={slide} />}
        {slide.type === "video" && <VideoSlideProps slide={slide} />}
        {slide.type === "logo" && <LogoSlideProps slide={slide} />}
      </div>
    </div>
  );
};
