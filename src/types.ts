export type TransitionType =
  | "none"
  | "fade"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "zoom-in"
  | "zoom-out"
  | "wipe-left"
  | "wipe-right";

export type TextAnimation =
  | "none"
  | "fade-in"
  | "typewriter"
  | "word-reveal"
  | "bounce-in"
  | "slide-up"
  | "scale-in"
  | "blur-in";

export type BackgroundAnimation =
  | "diamonds"
  | "grid"
  | "particles"
  | "aurora"
  | "ripple"
  | "constellation";

export type SlideType = "intro" | "text" | "clip" | "outro";

export interface IntroSlide {
  type: "intro";
  id: string;
  productName: string;
  tagline: string;
  subtitle: string;
  durationFrames: number;
  textAnimation: TextAnimation;
  backgroundAnimation: BackgroundAnimation;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

export interface TextSlide {
  type: "text";
  id: string;
  heading: string;
  subheading: string;
  durationFrames: number;
  textAnimation: TextAnimation;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  transition: TransitionType;
}

export interface ClipSlide {
  type: "clip";
  id: string;
  label: string;
  videoUrl: string;
  videoFileName: string;
  durationFrames: number;
  transition: TransitionType;
  zoomEffect: boolean;
}

export interface OutroSlide {
  type: "outro";
  id: string;
  logoUrl: string;
  logoFileName: string;
  tagline: string;
  durationFrames: number;
  textAnimation: TextAnimation;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

export type Slide = IntroSlide | TextSlide | ClipSlide | OutroSlide;

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

export const TRANSITION_OPTIONS: { value: TransitionType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade" },
  { value: "slide-left", label: "Slide Left" },
  { value: "slide-right", label: "Slide Right" },
  { value: "slide-up", label: "Slide Up" },
  { value: "slide-down", label: "Slide Down" },
  { value: "zoom-in", label: "Zoom In" },
  { value: "zoom-out", label: "Zoom Out" },
  { value: "wipe-left", label: "Wipe Left" },
  { value: "wipe-right", label: "Wipe Right" },
];

export const BACKGROUND_ANIMATION_OPTIONS: {
  value: BackgroundAnimation;
  label: string;
}[] = [
  { value: "diamonds", label: "Diamonds" },
  { value: "grid", label: "Grid" },
  { value: "particles", label: "Particles" },
  { value: "aurora", label: "Aurora" },
  { value: "ripple", label: "Ripple" },
  { value: "constellation", label: "Constellation" },
];

export const TEXT_ANIMATION_OPTIONS: {
  value: TextAnimation;
  label: string;
}[] = [
  { value: "none", label: "None" },
  { value: "fade-in", label: "Fade In" },
  { value: "typewriter", label: "Typewriter" },
  { value: "word-reveal", label: "Word Reveal" },
  { value: "bounce-in", label: "Bounce In" },
  { value: "slide-up", label: "Slide Up" },
  { value: "scale-in", label: "Scale In" },
  { value: "blur-in", label: "Blur In" },
];
