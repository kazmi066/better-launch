import type { LogoAnimationType } from "../../types";

export interface LogoAnimationContext {
  ctx: CanvasRenderingContext2D;
  image: CanvasImageSource | null;
  imageWidth: number;
  imageHeight: number;
  logoX: number;
  logoY: number;
  logoW: number;
  logoH: number;
  progress: number;
  size: { width: number; height: number };
}

export interface LogoAnimationRenderer {
  render(ctx: LogoAnimationContext): void;
}

export type LogoAnimationFactory = () => LogoAnimationRenderer;

export type LogoAnimationRegistry = Record<
  LogoAnimationType,
  LogoAnimationFactory
>;
