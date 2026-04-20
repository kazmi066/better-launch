import { clamp, easeOutPower3 } from "../lib/easing";
import { drawTextBlock } from "../lib/text-draw";
import type { AnimationFactory, AnimationRenderContext } from "./types";

const HEADING_END = 0.7 / 0.85;
const SUB_START = 0.25 / 0.85;

export const shutterUp: AnimationFactory = () => ({
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

    const ph = easeOutPower3(clamp(progress / HEADING_END));
    drawTextBlock(c, heading, {
      x: headingX,
      y: headingY + (1 - ph) * heading.totalHeight,
      color: textColor,
      alpha: 1,
      align: textAlign,
      clip: {
        x: headingX,
        y: headingY,
        width: heading.totalWidth,
        height: heading.totalHeight,
      },
    });

    if (subheading) {
      const ps = easeOutPower3(clamp((progress - SUB_START) / (1 - SUB_START)));
      drawTextBlock(c, subheading, {
        x: subheadingX,
        y: subheadingY + (1 - ps) * subheading.totalHeight,
        color: textColor,
        alpha: 0.7,
        align: textAlign,
        clip: {
          x: subheadingX,
          y: subheadingY,
          width: subheading.totalWidth,
          height: subheading.totalHeight,
        },
      });
    }
  },
});
