import { clamp, easeOutPower3 } from "../../lib/easing";
import type { LogoAnimationFactory, LogoAnimationContext } from "./types";

const IRIS_END = 0.75;

export const irisReveal: LogoAnimationFactory = () => ({
  render(ctx: LogoAnimationContext) {
    const { ctx: c, image, logoX, logoY, logoW, logoH, progress } = ctx;
    if (!image) return;

    const t = clamp(progress / IRIS_END);
    const eased = easeOutPower3(t);
    const cx = logoX + logoW / 2;
    const cy = logoY + logoH / 2;
    const maxRadius = (Math.hypot(logoW, logoH) / 2) * 1.05;
    const radius = maxRadius * eased;

    c.save();
    c.globalAlpha = clamp(t * 1.3);
    c.beginPath();
    c.arc(cx, cy, radius, 0, Math.PI * 2);
    c.clip();
    c.drawImage(image, logoX, logoY, logoW, logoH);
    c.restore();
  },
});
