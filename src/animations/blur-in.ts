import { clamp, easeOutPower3 } from "../lib/easing";
import { drawTextBlock } from "../lib/text-draw";
import type { AnimationFactory, AnimationRenderContext } from "./types";

const HEADING_END = 0.75 / 0.9;
const SUB_START = 0.35 / 0.9;
const HEADING_MAX_BLUR_PX = 24;
const SUB_MAX_BLUR_PX = 14;
const HEADING_START_SCALE = 1.06;

export const blurIn: AnimationFactory = () => ({
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
    const headingBlur = (1 - ph) * HEADING_MAX_BLUR_PX;
    const headingScale = 1 + (HEADING_START_SCALE - 1) * (1 - ph);
    const headingCx = headingX + heading.totalWidth / 2;
    const headingCy = headingY + heading.totalHeight / 2;

    c.save();
    if (headingBlur > 0.5) c.filter = `blur(${headingBlur.toFixed(2)}px)`;
    c.translate(headingCx, headingCy);
    c.scale(headingScale, headingScale);
    c.translate(-headingCx, -headingCy);
    drawTextBlock(c, heading, {
      x: headingX,
      y: headingY,
      color: textColor,
      alpha: ph,
      align: textAlign,
    });
    c.restore();

    if (subheading) {
      const ps = easeOutPower3(clamp((progress - SUB_START) / (1 - SUB_START)));
      const subBlur = (1 - ps) * SUB_MAX_BLUR_PX;

      c.save();
      if (subBlur > 0.5) c.filter = `blur(${subBlur.toFixed(2)}px)`;
      drawTextBlock(c, subheading, {
        x: subheadingX,
        y: subheadingY,
        color: textColor,
        alpha: ps * 0.75,
        align: textAlign,
      });
      c.restore();
    }
  },
});
