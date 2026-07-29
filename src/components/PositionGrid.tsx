import React from "react";
import type { TextPosition } from "../types";
import { cn } from "../lib/utils";

const GRID: TextPosition[][] = [
  ["top-left", "top-center", "top-right"],
  ["middle-left", "middle-center", "middle-right"],
  ["bottom-left", "bottom-center", "bottom-right"],
];

interface PositionGridProps {
  value: TextPosition;
  onChange: (pos: TextPosition) => void;
}

export const PositionGrid: React.FC<PositionGridProps> = ({
  value,
  onChange,
}) => (
  <div className="grid grid-cols-3 gap-1 w-20 h-20">
    {GRID.flat().map((pos) => (
      <button
        key={pos}
        type="button"
        aria-label={pos.replace("-", " ")}
        aria-pressed={value === pos}
        onClick={() => onChange(pos)}
        className={cn(
          "rounded-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          value === pos
            ? "bg-brand scale-110"
            : "bg-secondary hover:bg-muted-foreground/30",
        )}
      />
    ))}
  </div>
);
