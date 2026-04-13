// ── Text animation types (GSAP-driven) ──────────────────────────────
export type TextAnimationType = "fade-in" | "split-reveal" | "shutter-up";

export const TEXT_ANIMATION_OPTIONS: {
  value: TextAnimationType;
  label: string;
  description: string;
}[] = [
  {
    value: "fade-in",
    label: "Fade In",
    description: "Smooth opacity fade with subtle upward drift",
  },
  {
    value: "split-reveal",
    label: "Split Reveal",
    description: "Word-by-word staggered reveal",
  },
  {
    value: "shutter-up",
    label: "Shutter Up",
    description: "Text slides up from behind a clip mask",
  },
];

// ── 9-point text position grid ───────────────────────────────────────
export type TextPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export const POSITION_OPTIONS: { value: TextPosition; label: string }[] = [
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "top-right", label: "Top Right" },
  { value: "middle-left", label: "Middle Left" },
  { value: "middle-center", label: "Middle Center" },
  { value: "middle-right", label: "Middle Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right", label: "Bottom Right" },
];

// ── Background types ─────────────────────────────────────────────────
export type BackgroundType = "color" | "image" | "video";

// ── Slide types ──────────────────────────────────────────────────────
export interface StandardSlide {
  type: "standard";
  id: string;
  heading: string;
  subheading: string;
  textAnimation: TextAnimationType;
  textPosition: TextPosition;
  textColor: string;
  fontSize: number;
  backgroundType: BackgroundType;
  backgroundColor: string;
  backgroundImageUrl: string;
  backgroundImageFileName: string;
  backgroundVideoUrl: string;
  backgroundVideoFileName: string;
  durationSeconds: number;
}

export interface VideoSlide {
  type: "video";
  id: string;
  label: string;
  videoUrl: string;
  videoFileName: string;
  durationSeconds: number;
}

export type Slide = StandardSlide | VideoSlide;

// ── Project settings ─────────────────────────────────────────────────
export interface ProjectSettings {
  fps: number;
  width: number;
  height: number;
}

export const DEFAULT_SETTINGS: ProjectSettings = {
  fps: 30,
  width: 1920,
  height: 1080,
};
