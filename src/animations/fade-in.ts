import { clamp, easeOutPower3 } from "../lib/easing";
import { drawTextBlock } from "../lib/text-draw";
import type { AnimationFactory, AnimationRenderContext } from "./types";

const HEADING_END = 0.8 / 0.9;
const SUB_START = 0.3 / 0.9;
const HEADING_RISE_PX = 30;
const SUB_RISE_PX = 20;

export const fadeIn: AnimationFactory = () => ({
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

    const h = easeOutPower3(clamp(progress / HEADING_END));
    drawTextBlock(c, heading, {
      x: headingX,
      y: headingY + (1 - h) * HEADING_RISE_PX,
      color: textColor,
      alpha: h,
      align: textAlign,
    });

    if (subheading) {
      const s = easeOutPower3(clamp((progress - SUB_START) / (1 - SUB_START)));
      drawTextBlock(c, subheading, {
        x: subheadingX,
        y: subheadingY + (1 - s) * SUB_RISE_PX,
        color: textColor,
        alpha: s * 0.7,
        align: textAlign,
      });
    }
  },
});
