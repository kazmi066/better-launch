import { create } from "zustand";
import type { Slide, ProjectSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

let idCounter = 0;
export const newId = () => `slide-${++idCounter}-${Date.now()}`;

const defaultIntro = (): Slide => ({
  type: "intro",
  id: newId(),
  productName: "Your Product",
  tagline: "The future starts here",
  subtitle: "Built for developers who ship fast",
  durationFrames: 150,
  textAnimation: "word-reveal",
  backgroundAnimation: "diamonds",
  backgroundColor: "#09090b",
  textColor: "#fafafa",
  accentColor: "#6d28d9",
});

const defaultOutro = (): Slide => ({
  type: "outro",
  id: newId(),
  logoUrl: "",
  logoFileName: "",
  tagline: "Try it today.",
  durationFrames: 120,
  textAnimation: "fade-in",
  backgroundColor: "#09090b",
  textColor: "#fafafa",
  accentColor: "#6d28d9",
});

interface ProjectStore {
  slides: Slide[];
  settings: ProjectSettings;
  selectedSlideId: string | null;
  isPlaying: boolean;

  setSlides: (slides: Slide[]) => void;
  addSlide: (slide: Slide, afterIndex?: number) => void;
  updateSlide: (id: string, patch: Partial<Slide>) => void;
  removeSlide: (id: string) => void;
  moveSlide: (fromIndex: number, toIndex: number) => void;
  selectSlide: (id: string | null) => void;
  setSettings: (settings: Partial<ProjectSettings>) => void;
  setIsPlaying: (playing: boolean) => void;
  totalDurationFrames: () => number;

  addTextSlide: (afterIndex?: number) => void;
  addClipSlide: (afterIndex?: number) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  slides: [defaultIntro(), defaultOutro()],
  settings: DEFAULT_SETTINGS,
  selectedSlideId: null,
  isPlaying: false,

  setSlides: (slides) => set({ slides }),

  addSlide: (slide, afterIndex) =>
    set((state) => {
      const newSlides = [...state.slides];
      if (afterIndex !== undefined && afterIndex >= 0) {
        newSlides.splice(afterIndex + 1, 0, slide);
      } else {
        const outroIdx = newSlides.findIndex((s) => s.type === "outro");
        if (outroIdx >= 0) {
          newSlides.splice(outroIdx, 0, slide);
        } else {
          newSlides.push(slide);
        }
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
    set((state) => {
      const slide = state.slides.find((s) => s.id === id);
      if (slide?.type === "intro" || slide?.type === "outro") return state;
      return {
        slides: state.slides.filter((s) => s.id !== id),
        selectedSlideId:
          state.selectedSlideId === id ? null : state.selectedSlideId,
      };
    }),

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

  totalDurationFrames: () =>
    get().slides.reduce((sum, s) => sum + s.durationFrames, 0),

  addTextSlide: (afterIndex) => {
    const slide: Slide = {
      type: "text",
      id: newId(),
      heading: "Your Heading Here",
      subheading: "",
      durationFrames: 90,
      textAnimation: "word-reveal",
      backgroundColor: "#18181b",
      textColor: "#fafafa",
      accentColor: "#6d28d9",
      transition: "fade",
    };
    get().addSlide(slide, afterIndex);
  },

  addClipSlide: (afterIndex) => {
    const slide: Slide = {
      type: "clip",
      id: newId(),
      label: "Demo Clip",
      videoUrl: "",
      videoFileName: "",
      durationFrames: 150,
      transition: "fade",
      zoomEffect: true,
    };
    get().addSlide(slide, afterIndex);
  },
}));
