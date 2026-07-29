import React, { useCallback } from "react";
import { useProjectStore } from "../../store";
import type { Slide, TransitionSettings, TransitionType } from "../../types";
import {
  DEFAULT_TRANSITION,
  TRANSITION_OPTIONS,
} from "../../types";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface TransitionControlsProps {
  slide: Slide;
  isFirstScene: boolean;
}

export const TransitionControls: React.FC<TransitionControlsProps> = ({
  slide,
  isFirstScene,
}) => {
  const updateSlide = useProjectStore((state) => state.updateSlide);
  const transition = slide.transition ?? DEFAULT_TRANSITION;
  const disabled = isFirstScene || slide.durationSeconds <= 0;
  const selectedOption =
    TRANSITION_OPTIONS.find((option) => option.value === transition.type) ??
    TRANSITION_OPTIONS[0]!;

  const updateTransition = useCallback(
    (patch: Partial<TransitionSettings>) => {
      updateSlide(slide.id, {
        transition: { ...transition, ...patch },
      });
    },
    [slide.id, transition, updateSlide],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label>Transition in</Label>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {isFirstScene
              ? "The opening scene starts directly."
              : "Composited at the project’s full export resolution."}
          </p>
        </div>
        {!isFirstScene && (
          <span className="shrink-0 rounded-full border border-brand/25 bg-brand/10 px-2.5 py-1 text-xs text-brand">
            Full quality
          </span>
        )}
      </div>

      <Select
        disabled={disabled}
        value={transition.type}
        onValueChange={(value) =>
          updateTransition({ type: value as TransitionType })
        }>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TRANSITION_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!disabled && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {selectedOption.description}
        </p>
      )}

      {!disabled && transition.type !== "cut" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label>Duration</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {transition.durationSeconds.toFixed(1)}s
            </span>
          </div>
          <Slider
            min={0.2}
            max={2}
            step={0.1}
            value={[transition.durationSeconds]}
            onValueChange={([durationSeconds]) => {
              if (durationSeconds !== undefined) {
                updateTransition({ durationSeconds });
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

