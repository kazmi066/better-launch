import React, { useState } from "react";
import {
  Film,
  Type,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Sparkles,
} from "lucide-react";
import { useProjectStore } from "../store";
import type { Slide } from "../types";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

const slideIcon = (type: Slide["type"]) => {
  switch (type) {
    case "standard":
      return <Type className="w-3.5 h-3.5" />;
    case "video":
      return <Film className="w-3.5 h-3.5" />;
    case "logo":
      return <Sparkles className="w-3.5 h-3.5" />;
  }
};

const slideLabel = (slide: Slide) => {
  switch (slide.type) {
    case "standard":
      return slide.heading || "Standard Slide";
    case "video":
      return slide.label || "Video Clip";
    case "logo":
      return slide.label || "Brand Logo";
  }
};

const slideBorderColor = (type: Slide["type"]) => {
  switch (type) {
    case "standard":
      return "border-l-white";
    case "video":
      return "border-l-[#0070f3]";
    case "logo":
      return "border-l-[#f5a623]";
  }
};

export const SlideList: React.FC = () => {
  const slides = useProjectStore((s) => s.slides);
  const selectedSlideId = useProjectStore((s) => s.selectedSlideId);
  const selectSlide = useProjectStore((s) => s.selectSlide);
  const removeSlide = useProjectStore((s) => s.removeSlide);
  const moveSlide = useProjectStore((s) => s.moveSlide);
  const addStandardSlide = useProjectStore((s) => s.addStandardSlide);
  const addVideoSlide = useProjectStore((s) => s.addVideoSlide);
  const addLogoSlide = useProjectStore((s) => s.addLogoSlide);

  const [showAddMenu, setShowAddMenu] = useState(false);

  const totalSeconds = slides
    .reduce((s, sl) => {
      if (sl.type === "standard" || sl.type === "logo") {
        return s + sl.durationSeconds + sl.delaySeconds;
      }
      return s + sl.durationSeconds;
    }, 0)
    .toFixed(1);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3">
        <h2 className="text-[13px] font-semibold text-foreground">Slides</h2>
        <p className="text-[11px] text-muted-foreground">
          {slides.length} slide{slides.length !== 1 ? "s" : ""} · {totalSeconds}
          s
        </p>
      </div>
      <div className="px-4 pb-3 flex gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addStandardSlide()}
          className="h-7 text-[11px] gap-1">
          <Type className="w-3 h-3" />
          Text
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addVideoSlide()}
          className="h-7 text-[11px] gap-1">
          <Film className="w-3 h-3" />
          Video
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addLogoSlide()}
          className="h-7 text-[11px] gap-1">
          <Sparkles className="w-3 h-3" />
          Logo
        </Button>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {slides.map((slide, index) => {
          const isSelected = slide.id === selectedSlideId;
          const canMoveUp = index > 0;
          const canMoveDown = index < slides.length - 1;

          return (
            <div
              key={slide.id}
              onClick={() => selectSlide(slide.id)}
              className={cn(
                "group flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-2 cursor-pointer transition-all",
                slideBorderColor(slide.type),
                isSelected
                  ? "bg-secondary ring-1 ring-ring"
                  : "hover:bg-secondary/50",
              )}>
              <div className="text-muted-foreground">
                {slideIcon(slide.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">
                  {slideLabel(slide)}
                </p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {slide.type} ·{" "}
                  {slide.type === "standard" || slide.type === "logo"
                    ? (slide.durationSeconds + slide.delaySeconds).toFixed(1)
                    : slide.durationSeconds.toFixed(1)}
                  s
                </p>
              </div>

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {canMoveUp && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSlide(index, index - 1);
                    }}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                )}
                {canMoveDown && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSlide(index, index + 1);
                    }}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSlide(slide.id);
                  }}
                  className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="px-3 py-3 relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full h-8 text-[11px] border-dashed text-muted-foreground hover:text-foreground">
          <Plus className="w-3 h-3 mr-1" />
          Add Slide
        </Button>

        {showAddMenu && (
          <div className="absolute bottom-14 left-3 right-3 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-10">
            <button
              onClick={() => {
                addStandardSlide();
                setShowAddMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-secondary transition-colors text-left">
              <Type className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  Standard Slide
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Text with GSAP animations & custom background
                </p>
              </div>
            </button>
            <button
              onClick={() => {
                addVideoSlide();
                setShowAddMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-secondary transition-colors text-left">
              <Film className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  Video Slide
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Import a local video file
                </p>
              </div>
            </button>
            <button
              onClick={() => {
                addLogoSlide();
                setShowAddMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-secondary transition-colors text-left">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  Logo Slide
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Centered brand logo with optional caption
                </p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
