import type { AnimationRegistry } from "./types";
import { fadeIn } from "./fade-in";
import { splitReveal } from "./split-reveal";
import { shutterUp } from "./shutter-up";
import { blurIn } from "./blur-in";
import { charStagger } from "./char-stagger";
import { scalePop } from "./scale-pop";

export const animations: AnimationRegistry = {
  "fade-in": fadeIn,
  "split-reveal": splitReveal,
  "shutter-up": shutterUp,
  "blur-in": blurIn,
  "char-stagger": charStagger,
  "scale-pop": scalePop,
};

export type {
  AnimationFactory,
  AnimationRenderer,
  AnimationRenderContext,
} from "./types";
