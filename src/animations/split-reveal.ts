import gsap from "gsap";
import type { AnimationFactory } from "./types";

function wrapWords(el: HTMLElement): HTMLElement[] {
  const text = el.textContent || "";
  el.textContent = "";
  const words = text.split(/\s+/).filter(Boolean);
  const spans: HTMLElement[] = [];
  const wrappers: HTMLElement[] = [];

  // First pass: create all word wrappers and inner spans
  words.forEach((word, i) => {
    const wordSpan = document.createElement("span");
    wordSpan.style.display = "inline-block";
    wordSpan.style.overflow = "hidden";
    wordSpan.style.verticalAlign = "bottom"; // Align to bottom so height matches text

    const inner = document.createElement("span");
    inner.style.display = "inline-block";
    inner.textContent = word;
    wordSpan.appendChild(inner);

    el.appendChild(wordSpan);
    if (i < words.length - 1) {
      el.appendChild(document.createTextNode("\u00A0"));
    }

    spans.push(inner);
    wrappers.push(wordSpan);
  });

  // Force reflow to get computed dimensions
  void el.offsetHeight;

  // Second pass: set explicit height on each wrapper based on inner span's height
  spans.forEach((inner, i) => {
    const wrapper = wrappers[i];
    if (wrapper && inner) {
      const height = inner.offsetHeight;
      wrapper.style.height = `${height}px`;
    }
  });

  return spans;
}

export const splitReveal: AnimationFactory = ({ headingEl, subheadingEl }) => {
  const tl = gsap.timeline({ paused: true });

  if (headingEl) {
    const headingWords = wrapWords(headingEl);
    tl.fromTo(
      headingWords,
      { y: "110%", opacity: 0 },
      {
        y: "0%",
        opacity: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: "power4.out",
      },
      0,
    );
  }

  if (subheadingEl) {
    const subWords = wrapWords(subheadingEl);
    tl.fromTo(
      subWords,
      { y: "110%", opacity: 0 },
      {
        y: "0%",
        opacity: 1,
        duration: 0.5,
        stagger: 0.06,
        ease: "power4.out",
      },
      0.4,
    );
  }

  return tl;
};
