import type { Slide, TransitionType } from "../types";
import { DEFAULT_TRANSITION } from "../types";

export interface SlideTimeInfo {
  slide: Slide;
  index: number;
  startTime: number;
  endTime: number;
  localTime: number;
  localProgress: number;
}

export interface TimelineTransitionInfo {
  type: Exclude<TransitionType, "cut">;
  durationSeconds: number;
  progress: number;
}

export interface TimelineFrameInfo {
  active: SlideTimeInfo | null;
  previous: SlideTimeInfo | null;
  transition: TimelineTransitionInfo | null;
}

export function getEffectiveDuration(slide: Slide): number {
  if (slide.type === "standard" || slide.type === "logo") {
    return slide.durationSeconds + slide.delaySeconds;
  }
  return slide.durationSeconds;
}

export function getActiveSlide(
  slides: Slide[],
  currentTime: number,
): SlideTimeInfo | null {
  let cumulative = 0;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]!;
    const effectiveDuration = getEffectiveDuration(slide);

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
    const lastEffective = getEffectiveDuration(lastSlide);
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

export function getTimelineFrame(
  slides: Slide[],
  currentTime: number,
): TimelineFrameInfo {
  const active = getActiveSlide(slides, currentTime);
  if (!active || active.index === 0) {
    return { active, previous: null, transition: null };
  }

  const settings = active.slide.transition ?? DEFAULT_TRANSITION;
  if (settings.type === "cut") {
    return { active, previous: null, transition: null };
  }

  const configuredDuration = Number.isFinite(settings.durationSeconds)
    ? settings.durationSeconds
    : DEFAULT_TRANSITION.durationSeconds;
  const durationSeconds = Math.min(
    Math.max(0.1, configuredDuration),
    Math.max(0, active.slide.durationSeconds),
  );

  if (
    durationSeconds <= 0 ||
    active.localTime < 0 ||
    active.localTime >= durationSeconds
  ) {
    return { active, previous: null, transition: null };
  }

  const previousSlide = slides[active.index - 1]!;
  const previousDuration = getEffectiveDuration(previousSlide);
  const previousStart = active.startTime - previousDuration;
  const previous: SlideTimeInfo = {
    slide: previousSlide,
    index: active.index - 1,
    startTime: previousStart,
    endTime: active.startTime,
    localTime: previousSlide.durationSeconds,
    localProgress: 1,
  };

  return {
    active,
    previous,
    transition: {
      type: settings.type,
      durationSeconds,
      progress: active.localTime / durationSeconds,
    },
  };
}

export function getTotalDuration(slides: Slide[]): number {
  return slides.reduce((sum, slide) => sum + getEffectiveDuration(slide), 0);
}
