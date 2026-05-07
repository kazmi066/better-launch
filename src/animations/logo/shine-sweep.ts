import { clamp, easeInOutPower3, easeOutPower3 } from "../../lib/easing";
import type { LogoAnimationFactory, LogoAnimationContext } from "./types";

const FADE_END = 0.4;
const SWEEP_START = 0.3;
const SWEEP_END = 0.95;
const STRIPE_WIDTH_FRACTION = 0.35;
const STRIPE_TILT_RAD = Math.PI / 7;

let cachedTemp: HTMLCanvasElement | null = null;
function getTempCanvas(w: number, h: number): HTMLCanvasElement {
  if (!cachedTemp) cachedTemp = document.createElement("canvas");
  const tw = Math.ceil(w);
  const th = Math.ceil(h);
  if (cachedTemp.width !== tw) cachedTemp.width = tw;
  if (cachedTemp.height !== th) cachedTemp.height = th;
  return cachedTemp;
}

export const shineSweep: LogoAnimationFactory = () => ({
  render(ctx: LogoAnimationContext) {
    const { ctx: c, image, logoX, logoY, logoW, logoH, progress } = ctx;
    if (!image) return;

    const fade = easeOutPower3(clamp(progress / FADE_END));

    c.save();
    c.globalAlpha = fade;
    c.drawImage(image, logoX, logoY, logoW, logoH);
    c.restore();

    if (progress < SWEEP_START) return;
    const sweepP = easeInOutPower3(
      clamp((progress - SWEEP_START) / (SWEEP_END - SWEEP_START)),
    );

    const temp = getTempCanvas(logoW, logoH);
    const tctx = temp.getContext("2d");
    if (!tctx) return;
    tctx.clearRect(0, 0, temp.width, temp.height);
    tctx.drawImage(image, 0, 0, logoW, logoH);

    tctx.save();
    tctx.globalCompositeOperation = "source-atop";

    const stripeWidth = logoW * STRIPE_WIDTH_FRACTION;
    const travel = logoW + stripeWidth * 2;
    const sweepX = -stripeWidth + travel * sweepP;

    const tilt = STRIPE_TILT_RAD;
    const dx = Math.cos(tilt) * stripeWidth;
    const dy = Math.sin(tilt) * stripeWidth;
    const grad = tctx.createLinearGradient(sweepX, 0, sweepX + dx, dy);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.85)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    tctx.fillStyle = grad;
    tctx.fillRect(sweepX - logoW, -logoH, stripeWidth + logoW * 2, logoH * 3);

    tctx.restore();

    c.drawImage(temp, 0, 0, logoW, logoH, logoX, logoY, logoW, logoH);
  },
});
