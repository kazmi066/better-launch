import type gsap from "gsap";
import type { TextAnimationType } from "../types";

export interface AnimationContext {
  container: HTMLElement;
  headingEl: HTMLElement | null;
  subheadingEl: HTMLElement | null;
}

export type AnimationFactory = (ctx: AnimationContext) => gsap.core.Timeline;

export type AnimationRegistry = Record<TextAnimationType, AnimationFactory>;
