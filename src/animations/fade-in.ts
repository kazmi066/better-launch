import gsap from "gsap";
import type { AnimationFactory } from "./types";

export const fadeIn: AnimationFactory = ({ headingEl, subheadingEl }) => {
  const tl = gsap.timeline({ paused: true });

  if (headingEl) {
    tl.fromTo(
      headingEl,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      0,
    );
  }

  if (subheadingEl) {
    tl.fromTo(
      subheadingEl,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
      0.3,
    );
  }

  return tl;
};
