import { create } from "zustand";
import type {
  Slide,
  StandardSlide,
  VideoSlide,
  ProjectSettings,
  AudioTrack,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";

let idCounter = 0;
export const newId = () => `slide-${++idCounter}-${Date.now()}`;

// ── Default slide factories ──────────────────────────────────────────

export function createStandardSlide(
  overrides?: Partial<StandardSlide>,
): StandardSlide {
  return {
    type: "standard",
    id: newId(),
    heading: "Your Heading Here",
    subheading: "",
    textAnimation: "split-reveal",
    textPosition: "middle-center",
    textColor: "#ffffff",
    fontSize: 64,
    backgroundType: "color",
    backgroundColor: "#09090b",
    backgroundImageUrl: "",
    backgroundImageFileName: "",
    backgroundVideoUrl: "",
    backgroundVideoFileName: "",
    durationSeconds: 4,
    ...overrides,
  };
}

export function createVideoSlide(overrides?: Partial<VideoSlide>): VideoSlide {
  return {
    type: "video",
    id: newId(),
    label: "Video Clip",
    videoUrl: "",
    videoFileName: "",
    durationSeconds: 0,
    sourceDurationSeconds: 0,
    trimStart: 0,
    trimEnd: 0,
    ...overrides,
  };
}

// ── Store ────────────────────────────────────────────────────────────

interface ProjectStore {
  slides: Slide[];
  settings: ProjectSettings;
  selectedSlideId: string | null;
  isPlaying: boolean;
  currentTime: number;
  audioTrack: AudioTrack | null;

  setSlides: (slides: Slide[]) => void;
  addSlide: (slide: Slide, afterIndex?: number) => void;
  updateSlide: (id: string, patch: Partial<Slide>) => void;
  removeSlide: (id: string) => void;
  moveSlide: (fromIndex: number, toIndex: number) => void;
  selectSlide: (id: string | null) => void;
  setSettings: (settings: Partial<ProjectSettings>) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;

  setAudioTrack: (track: AudioTrack | null) => void;
  updateAudioTrack: (patch: Partial<AudioTrack>) => void;

  totalDurationSeconds: () => number;
  totalDurationFrames: () => number;

  addStandardSlide: (afterIndex?: number) => void;
  addVideoSlide: (afterIndex?: number) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  slides: [
    createStandardSlide({
      heading: "Your Product",
      subheading: "The future starts here",
    }),
  ],
  settings: DEFAULT_SETTINGS,
  selectedSlideId: null,
  isPlaying: false,
  currentTime: 0,
  audioTrack: null,

  setSlides: (slides) => set({ slides }),

  addSlide: (slide, afterIndex) =>
    set((state) => {
      const newSlides = [...state.slides];
      if (afterIndex !== undefined && afterIndex >= 0) {
        newSlides.splice(afterIndex + 1, 0, slide);
      } else {
        newSlides.push(slide);
      }
      return { slides: newSlides, selectedSlideId: slide.id };
    }),

  updateSlide: (id, patch) =>
    set((state) => ({
      slides: state.slides.map((s) =>
        s.id === id ? ({ ...s, ...patch } as Slide) : s,
      ),
    })),

  removeSlide: (id) =>
    set((state) => ({
      slides: state.slides.filter((s) => s.id !== id),
      selectedSlideId:
        state.selectedSlideId === id ? null : state.selectedSlideId,
    })),

  moveSlide: (fromIndex, toIndex) =>
    set((state) => {
      const newSlides = [...state.slides];
      const [moved] = newSlides.splice(fromIndex, 1);
      if (!moved) return state;
      newSlides.splice(toIndex, 0, moved);
      return { slides: newSlides };
    }),

  selectSlide: (id) => set({ selectedSlideId: id }),

  setSettings: (patch) =>
    set((state) => ({ settings: { ...state.settings, ...patch } })),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setAudioTrack: (track) => {
    const prev = get().audioTrack;
    if (prev && prev.url !== track?.url) {
      // Release the previous ObjectURL so we don't leak memory when the user swaps one file for another.
      try {
        URL.revokeObjectURL(prev.url);
      } catch {}
    }
    set({ audioTrack: track });
  },

  updateAudioTrack: (patch) =>
    set((state) =>
      state.audioTrack
        ? { audioTrack: { ...state.audioTrack, ...patch } }
        : state,
    ),

  totalDurationSeconds: () =>
    get().slides.reduce((sum, s) => sum + s.durationSeconds, 0),

  totalDurationFrames: () => {
    const { fps } = get().settings;
    return Math.round(get().totalDurationSeconds() * fps);
  },

  addStandardSlide: (afterIndex) => {
    get().addSlide(createStandardSlide(), afterIndex);
  },

  addVideoSlide: (afterIndex) => {
    get().addSlide(createVideoSlide(), afterIndex);
  },
}));
