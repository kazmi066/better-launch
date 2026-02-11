import React from "react";
import { AbsoluteFill, Series } from "remotion";
import type { Slide } from "../types";
import {
  IntroComposition,
  TextComposition,
  ClipComposition,
  OutroComposition,
} from "./SlideCompositions";

interface VideoCompositionProps {
  slides: Slide[];
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  slides,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
      <Series>
        {slides.map((slide) => (
          <Series.Sequence key={slide.id} durationInFrames={slide.durationFrames}>
            {slide.type === "intro" && <IntroComposition slide={slide} />}
            {slide.type === "text" && <TextComposition slide={slide} />}
            {slide.type === "clip" && <ClipComposition slide={slide} />}
            {slide.type === "outro" && <OutroComposition slide={slide} />}
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};
