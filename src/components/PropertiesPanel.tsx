import React from "react";
import { useProjectStore } from "../store";
import { Separator } from "./ui/separator";
import { StandardSlideProps } from "./properties/StandardSlideProps";
import { VideoSlideProps } from "./properties/VideoSlideProps";
import { LogoSlideProps } from "./properties/LogoSlideProps";
import { TransitionControls } from "./properties/TransitionControls";

export const PropertiesPanel: React.FC = () => {
  const slides = useProjectStore((s) => s.slides);
  const selectedSlideId = useProjectStore((s) => s.selectedSlideId);
  const slide = slides.find((s) => s.id === selectedSlideId);
  const slideIndex = slides.findIndex((s) => s.id === selectedSlideId);

  if (!slide) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
        <div>
          <div className="mx-auto mb-3 grid h-9 w-9 place-items-center rounded-xl border border-border bg-secondary/50 text-sm">
            01
          </div>
          <p className="text-sm font-medium text-foreground/80">
            Choose a scene
          </p>
          <p className="mt-1 max-w-52 text-xs leading-relaxed">
            Select one from the storyboard to shape its content and motion.
          </p>
        </div>
      </div>
    );
  }

  const typeLabel: Record<string, string> = {
    standard: "Title scene",
    video: "Video scene",
    logo: "Brand scene",
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 pb-4 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Inspector
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
          {typeLabel[slide.type] || "Properties"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Content, timing, and appearance
        </p>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto p-5 pb-10">
        {slide.type === "standard" && <StandardSlideProps slide={slide} />}
        {slide.type === "video" && <VideoSlideProps slide={slide} />}
        {slide.type === "logo" && <LogoSlideProps slide={slide} />}
        <Separator className="my-6" />
        <TransitionControls
          slide={slide}
          isFirstScene={slideIndex === 0}
        />
      </div>
    </div>
  );
};
