import type { LogoAnimationRegistry } from "./types";
import { fadeIn } from "./fade-in";
import { scalePop } from "./scale-pop";
import { irisReveal } from "./iris-reveal";
import { shineSweep } from "./shine-sweep";
import { dropBounce } from "./drop-bounce";

export const logoAnimations: LogoAnimationRegistry = {
  "fade-in": fadeIn,
  "scale-pop": scalePop,
  "iris-reveal": irisReveal,
  "shine-sweep": shineSweep,
  "drop-bounce": dropBounce,
};

export type {
  LogoAnimationFactory,
  LogoAnimationRenderer,
  LogoAnimationContext,
} from "./types";
