import { clamp, easeOutPower3 } from "../../lib/easing";
import type { LogoAnimationFactory, LogoAnimationContext } from "./types";

const FADE_END = 0.7;

export const fadeIn: LogoAnimationFactory = () => ({
  render(ctx: LogoAnimationContext) {
    const { ctx: c, image, logoX, logoY, logoW, logoH, progress } = ctx;
    if (!image) return;

    const eased = easeOutPower3(clamp(progress / FADE_END));
    const scale = 0.95 + 0.05 * eased;
    const cx = logoX + logoW / 2;
    const cy = logoY + logoH / 2;

    c.save();
    c.globalAlpha = eased;
    c.translate(cx, cy);
    c.scale(scale, scale);
    c.translate(-cx, -cy);
    c.drawImage(image, logoX, logoY, logoW, logoH);
    c.restore();
  },
});
