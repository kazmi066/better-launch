import gsap from "gsap";
import type { AnimationFactory } from "./types";

function wrapInMask(el: HTMLElement): HTMLElement {
  const mask = document.createElement("div");
  mask.style.overflow = "hidden";
  mask.style.display = "inline-block";
  mask.style.width = "100%";

  const inner = document.createElement("div");
  inner.style.display = "block";
  inner.innerHTML = el.innerHTML;
  el.innerHTML = "";

  mask.appendChild(inner);
  el.appendChild(mask);

  // Force reflow then set explicit height on mask based on content
  void el.offsetHeight;
  const contentHeight = inner.offsetHeight;
  mask.style.height = `${contentHeight}px`;

  return inner;
}

export const shutterUp: AnimationFactory = ({ headingEl, subheadingEl }) => {
  const tl = gsap.timeline({ paused: true });

  if (headingEl) {
    const inner = wrapInMask(headingEl);
    tl.fromTo(
      inner,
      { y: "100%" },
      { y: "0%", duration: 0.7, ease: "power3.out" },
      0,
    );
  }

  if (subheadingEl) {
    const inner = wrapInMask(subheadingEl);
    tl.fromTo(
      inner,
      { y: "100%" },
      { y: "0%", duration: 0.6, ease: "power3.out" },
      0.25,
    );
  }

  return tl;
};
