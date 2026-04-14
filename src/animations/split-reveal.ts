import gsap from "gsap";
import type { AnimationFactory } from "./types";

function wrapWords(el: HTMLElement): HTMLElement[] {
  const text = el.textContent || "";
  el.textContent = "";
  const words = text.split(/\s+/).filter(Boolean);
  const spans: HTMLElement[] = [];

  words.forEach((word, i) => {
    const wordSpan = document.createElement("span");
    wordSpan.style.display = "inline-block";
    wordSpan.style.overflow = "hidden";

    const inner = document.createElement("span");
    inner.style.display = "inline-block";
    inner.textContent = word;
    wordSpan.appendChild(inner);

    el.appendChild(wordSpan);
    if (i < words.length - 1) {
      el.appendChild(document.createTextNode("\u00A0"));
    }
    spans.push(inner);
  });

  return spans;
}

export const splitReveal: AnimationFactory = ({ headingEl, subheadingEl }) => {
  const tl = gsap.timeline({ paused: true });

  if (headingEl) {
    const headingWords = wrapWords(headingEl);
    void headingEl.offsetHeight;
    const h = headingWords[0]?.offsetHeight ?? 0;
    tl.fromTo(
      headingWords,
      { y: Math.ceil(h * 1.1), opacity: 0 },
      {
        y: 0,
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
    void subheadingEl.offsetHeight;
    const h = subWords[0]?.offsetHeight ?? 0;
    tl.fromTo(
      subWords,
      { y: Math.ceil(h * 1.1), opacity: 0 },
      {
        y: 0,
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
