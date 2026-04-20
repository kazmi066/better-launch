import { clamp, easeOutPower4 } from "../lib/easing";
import { applyFontStyle, type TextLayout } from "../lib/text-layout";
import type { AnimationFactory, AnimationRenderContext } from "./types";

const HEAD_WORD_DUR = 0.6;
const HEAD_STAGGER = 0.08;
const SUB_START_ABS = 0.4;
const SUB_WORD_DUR = 0.5;
const SUB_STAGGER = 0.06;

function lineStartX(
  align: "left" | "center" | "right",
  totalWidth: number,
  lineWidth: number,
): number {
  if (align === "center") return (totalWidth - lineWidth) / 2;
  if (align === "right") return totalWidth - lineWidth;
  return 0;
}

function countWords(layout: TextLayout): number {
  let n = 0;
  for (const l of layout.lines) n += l.words.length;
  return n;
}

interface BlockTiming {
  startOffsetAbs: number;
  wordDurationAbs: number;
  staggerAbs: number;
}

function drawWordReveal(
  ctx: CanvasRenderingContext2D,
  layout: TextLayout,
  blockX: number,
  blockY: number,
  align: "left" | "center" | "right",
  color: string,
  blockAlpha: number,
  absTime: number,
  timing: BlockTiming,
): void {
  ctx.save();
  applyFontStyle(ctx, layout);
  ctx.fillStyle = color;

  let globalWordIndex = 0;

  for (const line of layout.lines) {
    const lineX = blockX + lineStartX(align, layout.totalWidth, line.width);
    const lineY = blockY + line.offsetY;

    for (const word of line.words) {
      const naturalX = lineX + word.offsetX;
      const naturalY = lineY;

      const wStart =
        timing.startOffsetAbs + globalWordIndex * timing.staggerAbs;
      const p = easeOutPower4(
        clamp((absTime - wStart) / timing.wordDurationAbs),
      );
      const yOffset = (1 - p) * layout.lineHeightPx * 1.1;

      ctx.save();
      ctx.beginPath();
      ctx.rect(
        naturalX,
        naturalY,
        Math.ceil(word.width) + 1,
        layout.lineHeightPx,
      );
      ctx.clip();

      ctx.globalAlpha = blockAlpha * p;
      ctx.fillText(word.text, naturalX, naturalY + yOffset);
      ctx.restore();

      globalWordIndex++;
    }
  }

  ctx.restore();
}

export const splitReveal: AnimationFactory = () => ({
  render(ctx: AnimationRenderContext) {
    const {
      ctx: c,
      heading,
      subheading,
      headingX,
      headingY,
      subheadingX,
      subheadingY,
      textAlign,
      textColor,
      progress,
    } = ctx;

    const headWordCount = countWords(heading);
    const headEnd =
      Math.max(0, headWordCount - 1) * HEAD_STAGGER + HEAD_WORD_DUR;

    const subWordCount = subheading ? countWords(subheading) : 0;
    const subEnd = subheading
      ? SUB_START_ABS +
        Math.max(0, subWordCount - 1) * SUB_STAGGER +
        SUB_WORD_DUR
      : 0;

    const totalNat = Math.max(headEnd, subEnd, HEAD_WORD_DUR);
    const absTime = progress * totalNat;

    drawWordReveal(
      c,
      heading,
      headingX,
      headingY,
      textAlign,
      textColor,
      1,
      absTime,
      {
        startOffsetAbs: 0,
        wordDurationAbs: HEAD_WORD_DUR,
        staggerAbs: HEAD_STAGGER,
      },
    );

    if (subheading) {
      drawWordReveal(
        c,
        subheading,
        subheadingX,
        subheadingY,
        textAlign,
        textColor,
        0.7,
        absTime,
        {
          startOffsetAbs: SUB_START_ABS,
          wordDurationAbs: SUB_WORD_DUR,
          staggerAbs: SUB_STAGGER,
        },
      );
    }
  },
});
