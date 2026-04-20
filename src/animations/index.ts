import type { AnimationRegistry } from "./types";
import { fadeIn } from "./fade-in";
import { splitReveal } from "./split-reveal";
import { shutterUp } from "./shutter-up";

export const animations: AnimationRegistry = {
  "fade-in": fadeIn,
  "split-reveal": splitReveal,
  "shutter-up": shutterUp,
};

export type {
  AnimationFactory,
  AnimationRenderer,
  AnimationRenderContext,
} from "./types";
