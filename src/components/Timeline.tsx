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
import { TRANSITION_OPTIONS } from "../types";
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
      return "border-l-[#7dd3fc]";
    case "video":
      return "border-l-[#a5b4fc]";
    case "logo":
      return "border-l-[#c4b5fd]";
  }
};

const transitionLabel = (slide: Slide) => {
  const type = slide.transition?.type ?? "cut";
  return TRANSITION_OPTIONS.find((option) => option.value === type)?.label;
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
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Storyboard
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Scenes
            </h2>
          </div>
          <span className="rounded-full border border-border bg-secondary/60 px-2.5 py-1.5 text-xs tabular-nums text-muted-foreground">
            {totalSeconds}s
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addStandardSlide()}
          className="h-10 gap-1.5 rounded-lg border border-transparent bg-secondary/70 text-sm hover:border-border hover:bg-accent">
          <Type className="w-3 h-3" />
          Title
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addVideoSlide()}
          className="h-10 gap-1.5 rounded-lg border border-transparent bg-secondary/70 text-sm hover:border-border hover:bg-accent">
          <Film className="w-3 h-3" />
          Clip
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addLogoSlide()}
          className="h-10 gap-1.5 rounded-lg border border-transparent bg-secondary/70 text-sm hover:border-border hover:bg-accent">
          <Sparkles className="w-3 h-3" />
          Brand
        </Button>
      </div>

      <Separator />

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {slides.map((slide, index) => {
          const isSelected = slide.id === selectedSlideId;
          const canMoveUp = index > 0;
          const canMoveDown = index < slides.length - 1;

          return (
            <div
              key={slide.id}
              onClick={() => selectSlide(slide.id)}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl border border-transparent border-l-2 px-3 py-3 cursor-pointer transition-all",
                slideBorderColor(slide.type),
                isSelected
                  ? "border-y-border border-r-border bg-secondary shadow-[0_6px_24px_rgba(0,0,0,0.12)]"
                  : "hover:border-y-border/50 hover:border-r-border/50 hover:bg-secondary/45",
              )}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/20 text-muted-foreground">
                {slideIcon(slide.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {slideLabel(slide)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")} ·{" "}
                  {slide.type === "standard" ? "title" : slide.type} ·{" "}
                  {slide.type === "standard" || slide.type === "logo"
                    ? (slide.durationSeconds + slide.delaySeconds).toFixed(1)
                    : slide.durationSeconds.toFixed(1)}
                  s
                  {(slide.transition?.type ?? "cut") !== "cut"
                    ? ` · ${transitionLabel(slide)}`
                    : ""}
                </p>
              </div>

              <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md border border-border bg-popover/95 p-0.5 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                {canMoveUp && (
                  <button
                    aria-label={`Move ${slideLabel(slide)} up`}
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
                    aria-label={`Move ${slideLabel(slide)} down`}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSlide(index, index + 1);
                    }}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
                <button
                  aria-label={`Delete ${slideLabel(slide)}`}
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
          className="h-10 w-full rounded-lg border-dashed text-sm text-muted-foreground hover:border-brand/60 hover:text-foreground">
          <Plus className="w-3 h-3 mr-1" />
          Add scene
        </Button>

        {showAddMenu && (
          <div className="absolute bottom-14 left-3 right-3 z-10 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
            <button
              onClick={() => {
                addStandardSlide();
                setShowAddMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-secondary transition-colors text-left">
              <Type className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Title scene
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Animated type on color, image, or video
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
                <p className="text-sm font-medium text-foreground">
                  Video scene
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Import and trim product footage
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
                <p className="text-sm font-medium text-foreground">
                  Brand scene
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Close with your mark and a final line
                </p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
