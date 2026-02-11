import React from "react";
import {
  Film,
  Type,
  Play,
  Image,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useProjectStore } from "../store";
import type { Slide } from "../types";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

const slideIcon = (type: Slide["type"]) => {
  switch (type) {
    case "intro":
      return <Play className="w-3.5 h-3.5" />;
    case "text":
      return <Type className="w-3.5 h-3.5" />;
    case "clip":
      return <Film className="w-3.5 h-3.5" />;
    case "outro":
      return <Image className="w-3.5 h-3.5" />;
  }
};

const slideLabel = (slide: Slide) => {
  switch (slide.type) {
    case "intro":
      return slide.productName || "Intro";
    case "text":
      return slide.heading || "Text Slide";
    case "clip":
      return slide.label || "Video Clip";
    case "outro":
      return slide.tagline || "Outro";
  }
};

const slideBorderColor = (type: Slide["type"]) => {
  switch (type) {
    case "intro":
      return "border-l-white";
    case "text":
      return "border-l-[#888]";
    case "clip":
      return "border-l-[#0070f3]";
    case "outro":
      return "border-l-[#666]";
  }
};

export const Timeline: React.FC = () => {
  const slides = useProjectStore((s) => s.slides);
  const selectedSlideId = useProjectStore((s) => s.selectedSlideId);
  const selectSlide = useProjectStore((s) => s.selectSlide);
  const removeSlide = useProjectStore((s) => s.removeSlide);
  const moveSlide = useProjectStore((s) => s.moveSlide);
  const addTextSlide = useProjectStore((s) => s.addTextSlide);
  const addClipSlide = useProjectStore((s) => s.addClipSlide);
  const settings = useProjectStore((s) => s.settings);

  const totalFrames = slides.reduce((s, sl) => s + sl.durationFrames, 0);
  const totalSeconds = (totalFrames / settings.fps).toFixed(1);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h2 className="text-[13px] font-semibold text-foreground">
            Timeline
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {slides.length} slides · {totalSeconds}s
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addTextSlide()}
            className="h-7 text-[11px] gap-1"
          >
            <Type className="w-3 h-3" />
            Text
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addClipSlide()}
            className="h-7 text-[11px] gap-1"
          >
            <Film className="w-3 h-3" />
            Clip
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {slides.map((slide, index) => {
          const isSelected = slide.id === selectedSlideId;
          const canDelete = slide.type !== "intro" && slide.type !== "outro";
          const canMoveUp =
            index > 0 && !(index === 1 && slides[0]?.type === "intro");
          const canMoveDown =
            index < slides.length - 1 &&
            !(
              index === slides.length - 2 &&
              slides[slides.length - 1]?.type === "outro"
            );

          return (
            <div
              key={slide.id}
              onClick={() => selectSlide(slide.id)}
              className={cn(
                "group flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-2 cursor-pointer transition-all",
                slideBorderColor(slide.type),
                isSelected
                  ? "bg-secondary ring-1 ring-ring"
                  : "hover:bg-secondary/50"
              )}
            >
              <div className="text-muted-foreground">
                {slideIcon(slide.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">
                  {slideLabel(slide)}
                </p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {slide.type} ·{" "}
                  {(slide.durationFrames / settings.fps).toFixed(1)}s
                </p>
              </div>

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {canMoveUp && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSlide(index, index - 1);
                    }}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                )}
                {canMoveDown && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSlide(index, index + 1);
                    }}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSlide(slide.id);
                    }}
                    className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="px-3 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => addTextSlide()}
          className="w-full h-8 text-[11px] border-dashed text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Slide
        </Button>
      </div>
    </div>
  );
};
