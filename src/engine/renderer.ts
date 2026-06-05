import type { Slide } from "../types";

export interface SlideTimeInfo {
  slide: Slide;
  index: number;
  startTime: number;
  endTime: number;
  localTime: number;
  localProgress: number;
}

export function getActiveSlide(
  slides: Slide[],
  currentTime: number,
): SlideTimeInfo | null {
  let cumulative = 0;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]!;
    const effectiveDuration =
      slide.type === "standard" || slide.type === "logo"
        ? slide.durationSeconds + slide.delaySeconds
        : slide.durationSeconds;

    const start = cumulative;
    const end = cumulative + effectiveDuration;

    if (currentTime >= start && currentTime < end) {
      const elapsed = currentTime - start;
      return {
        slide,
        index: i,
        startTime: start,
        endTime: end,
        localTime:
          slide.type === "standard" || slide.type === "logo"
            ? Math.min(elapsed, slide.durationSeconds)
            : elapsed,
        localProgress:
          slide.durationSeconds > 0 ? elapsed / slide.durationSeconds : 0,
      };
    }

    cumulative = end;
  }

  if (slides.length > 0) {
    const lastSlide = slides[slides.length - 1]!;
    const lastEffective =
      lastSlide.type === "standard" || lastSlide.type === "logo"
        ? lastSlide.durationSeconds + lastSlide.delaySeconds
        : lastSlide.durationSeconds;
    return {
      slide: lastSlide,
      index: slides.length - 1,
      startTime: cumulative - lastEffective,
      endTime: cumulative,
      localTime: lastSlide.durationSeconds,
      localProgress: 1,
    };
  }

  return null;
}

export function getTotalDuration(slides: Slide[]): number {
  return slides.reduce((sum, s) => {
    if (s.type === "standard" || s.type === "logo") {
      return sum + s.durationSeconds + s.delaySeconds;
    }
    return sum + s.durationSeconds;
  }, 0);
}
