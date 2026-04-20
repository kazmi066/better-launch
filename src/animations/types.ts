import type { TextAnimationType } from "../types";
import type { TextLayout } from "../lib/text-layout";

export interface AnimationRenderContext {
  ctx: CanvasRenderingContext2D;
  heading: TextLayout;
  subheading: TextLayout | null;
  headingX: number;
  headingY: number;
  subheadingX: number;
  subheadingY: number;
  textAlign: "left" | "center" | "right";
  textColor: string;
  // Normalised timeline position across the slide's duration, 0..1.
  // Slide duration is effectively the animation duration: longer slides
  // stretch the animation, shorter slides compress it.
  progress: number;
}

export interface AnimationRenderer {
  render(context: AnimationRenderContext): void;
}

export type AnimationFactory = () => AnimationRenderer;

export type AnimationRegistry = Record<TextAnimationType, AnimationFactory>;
