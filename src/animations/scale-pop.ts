import { clamp, easeOutBack, easeOutPower3 } from "../lib/easing";
import { drawTextBlock } from "../lib/text-draw";
import type { AnimationFactory, AnimationRenderContext } from "./types";

// Heading "drops" in with an overshoot bounce, subhead drifts up gently
// behind it. Punchy launch-trailer feel that pairs well with short
// slides (1-3s) and bold headlines.
const HEADING_END = 0.65 / 0.9;
const SUB_START = 0.4 / 0.9;
const HEADING_START_SCALE = 0.7;
const SUB_RISE_PX = 18;
const HEADING_OVERSHOOT_C1 = 1.4;

export const scalePop: AnimationFactory = () => ({
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

    const tHead = clamp(progress / HEADING_END);
    const eased = easeOutBack(tHead, HEADING_OVERSHOOT_C1);
    const headingScale =
      HEADING_START_SCALE + (1 - HEADING_START_SCALE) * eased;
    const headingAlpha = easeOutPower3(clamp(tHead * 1.2));

    const headingCx = headingX + heading.totalWidth / 2;
    const headingCy = headingY + heading.totalHeight / 2;

    c.save();
    c.translate(headingCx, headingCy);
    c.scale(headingScale, headingScale);
    c.translate(-headingCx, -headingCy);
    drawTextBlock(c, heading, {
      x: headingX,
      y: headingY,
      color: textColor,
      alpha: headingAlpha,
      align: textAlign,
    });
    c.restore();

    if (subheading) {
      const ps = easeOutPower3(clamp((progress - SUB_START) / (1 - SUB_START)));
      drawTextBlock(c, subheading, {
        x: subheadingX,
        y: subheadingY + (1 - ps) * SUB_RISE_PX,
        color: textColor,
        alpha: ps * 0.75,
        align: textAlign,
      });
    }
  },
});
