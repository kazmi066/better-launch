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
        onClick={() => onChange(pos)}
        className={cn(
          "rounded-sm transition-all duration-150",
          value === pos
            ? "bg-foreground scale-110"
            : "bg-secondary hover:bg-muted-foreground/30",
        )}
      />
    ))}
  </div>
);

export function positionToFlex(pos: TextPosition): React.CSSProperties {
  const [vertical, horizontal] = pos.split("-") as [string, string];

  const justifyContent =
    vertical === "top"
      ? "flex-start"
      : vertical === "bottom"
        ? "flex-end"
        : "center";

  const alignItems =
    horizontal === "left"
      ? "flex-start"
      : horizontal === "right"
        ? "flex-end"
        : "center";

  const textAlign =
    horizontal === "left"
      ? ("left" as const)
      : horizontal === "right"
        ? ("right" as const)
        : ("center" as const);

  return {
    display: "flex",
    flexDirection: "column",
    justifyContent,
    alignItems,
    textAlign,
    padding: "8%",
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  };
}
