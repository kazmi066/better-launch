import { applyFontStyle, type TextLayout } from "./text-layout";

export type TextAlign = "left" | "center" | "right";

export interface DrawBlockOptions {
  x: number;
  y: number;
  color: string;
  alpha?: number;
  align: TextAlign;
  mapWord?: (word: {
    lineIndex: number;
    wordIndex: number;
    text: string;
    x: number;
    y: number;
    width: number;
  }) => { x: number; y: number; alpha?: number } | null;
  clip?: { x: number; y: number; width: number; height: number };
}

function alignX(align: TextAlign, totalWidth: number, lineWidth: number) {
  if (align === "center") return (totalWidth - lineWidth) / 2;
  if (align === "right") return totalWidth - lineWidth;
  return 0;
}

export function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  layout: TextLayout,
  opts: DrawBlockOptions,
): void {
  ctx.save();
  applyFontStyle(ctx, layout);

  const alpha = opts.alpha ?? 1;
  ctx.fillStyle = opts.color;

  if (opts.clip) {
    ctx.beginPath();
    ctx.rect(opts.clip.x, opts.clip.y, opts.clip.width, opts.clip.height);
    ctx.clip();
  }

  for (let li = 0; li < layout.lines.length; li++) {
    const line = layout.lines[li]!;
    const lineStartX =
      opts.x + alignX(opts.align, layout.totalWidth, line.width);
    const lineY = opts.y + line.offsetY;

    for (let wi = 0; wi < line.words.length; wi++) {
      const word = line.words[wi]!;
      const naturalX = lineStartX + word.offsetX;
      const naturalY = lineY;

      let drawX = naturalX;
      let drawY = naturalY;
      let drawAlpha = alpha;

      if (opts.mapWord) {
        const override = opts.mapWord({
          lineIndex: li,
          wordIndex: wi,
          text: word.text,
          x: naturalX,
          y: naturalY,
          width: word.width,
        });
        if (override === null) continue;
        drawX = override.x;
        drawY = override.y;
        if (override.alpha !== undefined) drawAlpha = alpha * override.alpha;
      }

      ctx.globalAlpha = drawAlpha;
      ctx.fillText(word.text, drawX, drawY);
    }
  }

  ctx.restore();
}

export function textBlockBounds(
  layout: TextLayout,
  x: number,
  y: number,
): { x: number; y: number; width: number; height: number } {
  return {
    x,
    y,
    width: layout.totalWidth,
    height: layout.totalHeight,
  };
}
