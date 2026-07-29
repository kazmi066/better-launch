// ── Text animation types ────────────────────────────────────────────
export type TextAnimationType =
  | "fade-in"
  | "split-reveal"
  | "shutter-up"
  | "blur-in"
  | "char-stagger"
  | "scale-pop";

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
  {
    value: "blur-in",
    label: "Blur In",
    description: "Heading emerges from a heavy blur with a subtle scale settle",
  },
  {
    value: "char-stagger",
    label: "Char Stagger",
    description: "Character-by-character reveal with a soft drift",
  },
  {
    value: "scale-pop",
    label: "Scale Pop",
    description: "Heading drops in with an overshoot bounce",
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
export type BackgroundType =
  | "color"
  | "image"
  | "video"
  | "gradient-mesh"
  | "aurora"
  | "technical-grid";

export type BackgroundMotionDirection = "forward" | "reverse";

export interface ProceduralBackgroundSettings {
  backgroundSecondaryColor: string;
  backgroundAccentColor: string;
  backgroundEnergy: number;
  backgroundScale: number;
  backgroundDirection: BackgroundMotionDirection;
  backgroundSeed: number;
}

export const PROCEDURAL_BACKGROUND_OPTIONS: {
  value: Extract<
    BackgroundType,
    "gradient-mesh" | "aurora" | "technical-grid"
  >;
  label: string;
  description: string;
}[] = [
  {
    value: "gradient-mesh",
    label: "Gradient Mesh",
    description: "Layered fields of sky and violet light",
  },
  {
    value: "aurora",
    label: "Aurora",
    description: "Soft flowing ribbons with cinematic depth",
  },
  {
    value: "technical-grid",
    label: "Technical Grid",
    description: "A precise perspective field for product reveals",
  },
];

export const DEFAULT_PROCEDURAL_BACKGROUND: ProceduralBackgroundSettings = {
  backgroundSecondaryColor: "#7dd3fc",
  backgroundAccentColor: "#c4b5fd",
  backgroundEnergy: 0.55,
  backgroundScale: 1,
  backgroundDirection: "forward",
  backgroundSeed: 7,
};

// ── Scene transitions ────────────────────────────────────────────────
// Transitions belong to the incoming scene. They play during the first
// `durationSeconds` of that scene, so the project duration never changes.
export type TransitionType =
  | "cut"
  | "dissolve"
  | "push-left"
  | "wipe-left"
  | "iris"
  | "zoom-through";

export interface TransitionSettings {
  type: TransitionType;
  durationSeconds: number;
}

export const TRANSITION_OPTIONS: {
  value: TransitionType;
  label: string;
  description: string;
}[] = [
  {
    value: "cut",
    label: "Cut",
    description: "Instant scene change with no overlap",
  },
  {
    value: "dissolve",
    label: "Dissolve",
    description: "Smooth cinematic crossfade",
  },
  {
    value: "push-left",
    label: "Push",
    description: "Both scenes travel left as one continuous frame",
  },
  {
    value: "wipe-left",
    label: "Wipe",
    description: "The new scene reveals cleanly from the left",
  },
  {
    value: "iris",
    label: "Iris",
    description: "A circular reveal opens from the center",
  },
  {
    value: "zoom-through",
    label: "Zoom Through",
    description: "The outgoing scene expands into the next",
  },
];

export const DEFAULT_TRANSITION: TransitionSettings = {
  type: "cut",
  durationSeconds: 0.6,
};

// ── Slide types ──────────────────────────────────────────────────────
export interface StandardSlide extends ProceduralBackgroundSettings {
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
  transition: TransitionSettings;
  durationSeconds: number;
  delaySeconds: number;
}

export interface VideoSlide {
  type: "video";
  id: string;
  label: string;
  videoUrl: string;
  videoFileName: string;
  // The trimmed slide length, used by the global timeline.
  // Always equals `trimEnd - trimStart`.
  durationSeconds: number;
  sourceDurationSeconds: number;
  trimStart: number;
  trimEnd: number;
  transition: TransitionSettings;
}

// ── Logo slide ──────────────────────────────────────────────────────
export type LogoAnimationType =
  | "fade-in"
  | "scale-pop"
  | "iris-reveal"
  | "shine-sweep"
  | "drop-bounce";

export const LOGO_ANIMATION_OPTIONS: {
  value: LogoAnimationType;
  label: string;
  description: string;
}[] = [
  {
    value: "fade-in",
    label: "Fade In",
    description: "Gentle opacity fade with a subtle scale settle",
  },
  {
    value: "scale-pop",
    label: "Scale Pop",
    description: "Drops in with an overshoot bounce",
  },
  {
    value: "iris-reveal",
    label: "Iris Reveal",
    description: "Circular mask expands from center",
  },
  {
    value: "shine-sweep",
    label: "Shine Sweep",
    description: "Logo fades in then a glossy highlight sweeps across",
  },
  {
    value: "drop-bounce",
    label: "Drop Bounce",
    description: "Falls from above and settles with a bounce",
  },
];

export interface LogoSlide {
  type: "logo";
  id: string;
  label: string;
  logoImageUrl: string;
  logoFileName: string;
  caption: string;
  captionFontSize: number;
  // Logo height as a fraction of the canvas height (e.g. 0.32 = 32%).
  logoSize: number;
  backgroundColor: string;
  textColor: string;
  animation: LogoAnimationType;
  transition: TransitionSettings;
  durationSeconds: number;
  delaySeconds: number;
}

export type Slide = StandardSlide | VideoSlide | LogoSlide;

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

// ── Audio track ──────────────────────────────────────────────────────

export interface AudioTrack {
  url: string;
  name: string;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  volume: number;
  // Pre-computed waveform peaks in 0..1, bin count is fixed when decoded
  waveform: number[];
}
