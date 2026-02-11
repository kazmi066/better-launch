import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
  Img,
  Video,
} from "remotion";
import type { IntroSlide, TextSlide, ClipSlide, OutroSlide } from "../types";
import { AnimatedText } from "./TextAnimations";
import { TransitionWrapper } from "./Transitions";
import { SlideBackground, GridBackground } from "./Decorations";

export const IntroComposition: React.FC<{ slide: IntroSlide }> = ({
  slide,
}) => {
  return (
    <AbsoluteFill>
      <SlideBackground
        animation={slide.backgroundAnimation ?? "diamonds"}
        accentColor={slide.accentColor}
        backgroundColor={slide.backgroundColor}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "0 10%",
          height: "100%",
          gap: 16,
        }}>
        <AnimatedText
          text={slide.subtitle}
          animation={slide.textAnimation}
          fontSize={36}
          color={slide.textColor + "88"}
          fontWeight={400}
          delay={0}
        />
        <AnimatedText
          text={slide.productName}
          animation={slide.textAnimation}
          fontSize={110}
          color={slide.accentColor}
          fontWeight={800}
          delay={10}
        />
        <AnimatedText
          text={slide.tagline}
          animation={slide.textAnimation}
          fontSize={64}
          color={slide.textColor}
          fontWeight={600}
          delay={25}
        />
      </div>
    </AbsoluteFill>
  );
};

export const TextComposition: React.FC<{
  slide: TextSlide;
}> = ({ slide }) => {
  return (
    <TransitionWrapper
      transition={slide.transition}
      durationInFrames={slide.durationFrames}>
      <AbsoluteFill>
        <GridBackground
          accentColor={slide.accentColor}
          backgroundColor={slide.backgroundColor}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            padding: "0 10%",
            gap: 20,
          }}>
          <AnimatedText
            text={slide.heading}
            animation={slide.textAnimation}
            fontSize={90}
            color={slide.textColor}
            fontWeight={700}
          />
          {slide.subheading && (
            <AnimatedText
              text={slide.subheading}
              animation={slide.textAnimation}
              fontSize={40}
              color={slide.textColor + "99"}
              fontWeight={400}
              delay={15}
            />
          )}
        </div>
      </AbsoluteFill>
    </TransitionWrapper>
  );
};

export const ClipComposition: React.FC<{
  slide: ClipSlide;
}> = ({ slide }) => {
  const frame = useCurrentFrame();

  const zoom = slide.zoomEffect
    ? interpolate(frame, [0, slide.durationFrames], [1, 1.05], {
        easing: Easing.bezier(0.33, 1, 0.68, 1),
      })
    : 1;

  return (
    <TransitionWrapper
      transition={slide.transition}
      durationInFrames={slide.durationFrames}>
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        {slide.videoUrl ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${zoom})`,
            }}>
            <Video
              src={slide.videoUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
              backgroundColor: "#18181b",
              color: "#71717a",
              fontSize: 32,
              fontFamily: "Inter, sans-serif",
            }}>
            No video selected — add a clip in the editor
          </div>
        )}
      </AbsoluteFill>
    </TransitionWrapper>
  );
};

export const OutroComposition: React.FC<{ slide: OutroSlide }> = ({
  slide,
}) => {
  const frame = useCurrentFrame();
  const logoOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const logoScale = interpolate(frame, [0, 25], [0.8, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: slide.backgroundColor,
        justifyContent: "center",
        alignItems: "center",
      }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}>
        {slide.logoUrl ? (
          <Img
            src={slide.logoUrl}
            style={{
              maxWidth: 300,
              maxHeight: 120,
              objectFit: "contain",
              opacity: logoOpacity,
              transform: `scale(${logoScale})`,
            }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 24,
              background: `linear-gradient(135deg, ${slide.accentColor}, ${slide.accentColor}88)`,
              opacity: logoOpacity,
              transform: `scale(${logoScale})`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 48,
              lineHeight: 1,
              color: "#fff",
              fontWeight: 800,
              fontFamily: "Inter, sans-serif",
            }}>
            ▶
          </div>
        )}
        <AnimatedText
          text={slide.tagline}
          animation={slide.textAnimation}
          fontSize={42}
          color={slide.accentColor}
          fontWeight={600}
          delay={20}
        />
      </div>
    </AbsoluteFill>
  );
};
