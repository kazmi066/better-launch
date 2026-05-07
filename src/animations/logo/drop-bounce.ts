import { clamp, easeOutBounce, easeOutPower3 } from "../../lib/easing";
import type { LogoAnimationFactory, LogoAnimationContext } from "./types";

const DROP_END = 0.75;

export const dropBounce: LogoAnimationFactory = () => ({
  render(ctx: LogoAnimationContext) {
    const { ctx: c, image, logoX, logoY, logoW, logoH, progress, size } = ctx;
    if (!image) return;

    const t = clamp(progress / DROP_END);
    const eased = easeOutBounce(t);

    const startY = -logoH - size.height * 0.05;
    const currentY = startY + (logoY - startY) * eased;
    const alpha = easeOutPower3(clamp(t * 1.6));

    c.save();
    c.globalAlpha = alpha;
    c.drawImage(image, logoX, currentY, logoW, logoH);
    c.restore();
  },
});
