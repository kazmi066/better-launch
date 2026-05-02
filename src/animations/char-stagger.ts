import { clamp, easeOutPower3 } from "../lib/easing";
import { applyFontStyle, type TextLayout } from "../lib/text-layout";
import type { AnimationFactory, AnimationRenderContext } from "./types";

// Character-level reveal with a soft drift. More granular than
// split-reveal (which is word-level) and gives the polished
const HEAD_CHAR_DUR = 0.55;
const HEAD_STAGGER = 0.022;
const SUB_START_ABS = 0.45;
const SUB_CHAR_DUR = 0.45;
const SUB_STAGGER = 0.014;

function lineStartX(
  align: "left" | "center" | "right",
  totalWidth: number,
  lineWidth: number,
): number {
  if (align === "center") return (totalWidth - lineWidth) / 2;
  if (align === "right") return totalWidth - lineWidth;
  return 0;
}

function countChars(layout: TextLayout): number {
  let n = 0;
  for (const line of layout.lines) {
    for (const w of line.words) n += w.text.length;
  }
  return n;
}

interface BlockTiming {
  startOffsetAbs: number;
  charDurationAbs: number;
  staggerAbs: number;
}

function drawCharReveal(
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

  const driftPx = layout.lineHeightPx * 0.35;
  let charIndex = 0;

  for (const line of layout.lines) {
    const lineX = blockX + lineStartX(align, layout.totalWidth, line.width);
    const lineY = blockY + line.offsetY;

    for (const word of line.words) {
      const wordX = lineX + word.offsetX;
      let prefix = 0;

      for (let i = 0; i < word.text.length; i++) {
        const ch = word.text[i]!;
        // Per-char advance includes whatever letterSpacing the canvas
        // is configured with, so geometry stays aligned with the
        // word-level layout.
        const advance = ctx.measureText(ch).width;

        const start = timing.startOffsetAbs + charIndex * timing.staggerAbs;
        const p = easeOutPower3(
          clamp((absTime - start) / timing.charDurationAbs),
        );

        if (p > 0) {
          ctx.globalAlpha = blockAlpha * p;
          ctx.fillText(ch, wordX + prefix, lineY + (1 - p) * driftPx);
        }

        prefix += advance;
        charIndex++;
      }
    }
  }

  ctx.restore();
}

export const charStagger: AnimationFactory = () => ({
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

    const headChars = countChars(heading);
    const headEnd = Math.max(0, headChars - 1) * HEAD_STAGGER + HEAD_CHAR_DUR;

    const subChars = subheading ? countChars(subheading) : 0;
    const subEnd = subheading
      ? SUB_START_ABS + Math.max(0, subChars - 1) * SUB_STAGGER + SUB_CHAR_DUR
      : 0;

    const totalNat = Math.max(headEnd, subEnd, HEAD_CHAR_DUR);
    const absTime = progress * totalNat;

    drawCharReveal(
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
        charDurationAbs: HEAD_CHAR_DUR,
        staggerAbs: HEAD_STAGGER,
      },
    );

    if (subheading) {
      drawCharReveal(
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
          charDurationAbs: SUB_CHAR_DUR,
          staggerAbs: SUB_STAGGER,
        },
      );
    }
  },
});
