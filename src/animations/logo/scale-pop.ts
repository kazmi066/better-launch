import { clamp, easeOutBack, easeOutPower3 } from "../../lib/easing";
import type { LogoAnimationFactory, LogoAnimationContext } from "./types";

const POP_END = 0.7;
const FROM_SCALE = 0.55;
const OVERSHOOT_C1 = 1.8;

export const scalePop: LogoAnimationFactory = () => ({
  render(ctx: LogoAnimationContext) {
    const { ctx: c, image, logoX, logoY, logoW, logoH, progress } = ctx;
    if (!image) return;

    const t = clamp(progress / POP_END);
    const popped = easeOutBack(t, OVERSHOOT_C1);
    const scale = FROM_SCALE + (1 - FROM_SCALE) * popped;
    const alpha = easeOutPower3(clamp(t * 1.4));

    const cx = logoX + logoW / 2;
    const cy = logoY + logoH / 2;

    c.save();
    c.globalAlpha = alpha;
    c.translate(cx, cy);
    c.scale(scale, scale);
    c.translate(-cx, -cy);
    c.drawImage(image, logoX, logoY, logoW, logoH);
    c.restore();
  },
});
