import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import type { TextAnimation } from "../types";

interface AnimatedTextProps {
  text: string;
  animation: TextAnimation;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  delay?: number;
}

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const WordAnimation: React.FC<{
  text: string;
  mode: "word-reveal" | "bounce-in";
  f: number;
  fps: number;
  style: React.CSSProperties;
}> = ({ text, mode, f, fps, style }) => {
  const words = text.split(" ");
  return (
    <span style={{ display: "inline" }}>
      {words.map((word, i) => {
        const wordDelay = i * (mode === "word-reveal" ? 6 : 5);
        const spr = spring({
          frame: f - wordDelay,
          fps,
          config:
            mode === "word-reveal"
              ? { damping: 20, stiffness: 80, mass: 0.8 }
              : { damping: 8, stiffness: 150, mass: 0.6 },
        });

        let transform: string;
        let opacity: number;

        if (mode === "word-reveal") {
          opacity = interpolate(spr, [0, 0.5], [0, 1]);
          const tx = interpolate(spr, [0, 1], [20, 0]);
          const sc = interpolate(spr, [0, 0.8], [0.95, 1]);
          transform = `translateX(${tx}px) scale(${sc})`;
        } else {
          opacity = spr;
          transform = `scale(${spr}) translateY(${(1 - spr) * 40}px)`;
        }

        return (
          <span
            key={i}
            style={{
              ...style,
              opacity,
              transform,
              marginRight: i < words.length - 1 ? "0.3em" : 0,
            }}>
            {word}
          </span>
        );
      })}
    </span>
  );
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  animation,
  fontSize = 80,
  color = "#fafafa",
  fontWeight = 700,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const base: React.CSSProperties = {
    fontSize,
    fontWeight,
    color,
    fontFamily: "Inter, sans-serif",
    display: "inline-block",
  };

  switch (animation) {
    case "fade-in": {
      const opacity = interpolate(f, [0, 20], [0, 1], CLAMP);
      const y = interpolate(f, [0, 20], [30, 0], {
        ...CLAMP,
        easing: Easing.out(Easing.cubic),
      });
      return (
        <span style={{ ...base, opacity, transform: `translateY(${y}px)` }}>
          {text}
        </span>
      );
    }

    case "typewriter": {
      const chars = text.length;
      const visibleChars = Math.floor(
        interpolate(f, [0, chars * 2], [0, chars], CLAMP),
      );
      return (
        <span style={{ ...base, letterSpacing: "-0.02em" }}>
          {text.slice(0, visibleChars)}
          {visibleChars < chars && (
            <span
              style={{
                opacity: f % 16 < 8 ? 1 : 0,
                borderRight: `3px solid ${color}`,
                marginLeft: 2,
              }}
            />
          )}
        </span>
      );
    }

    case "word-reveal":
    case "bounce-in":
      return (
        <WordAnimation
          text={text}
          mode={animation}
          f={f}
          fps={fps}
          style={base}
        />
      );

    case "slide-up": {
      const spr = spring({
        frame: f,
        fps,
        config: { damping: 20, stiffness: 60, mass: 1 },
      });
      return (
        <span
          style={{
            ...base,
            opacity: spr,
            transform: `translateY(${(1 - spr) * 80}px)`,
          }}>
          {text}
        </span>
      );
    }

    case "scale-in": {
      const spr = spring({
        frame: f,
        fps,
        config: { damping: 15, stiffness: 100, mass: 0.8 },
      });
      return (
        <span
          style={{
            ...base,
            opacity: spr,
            transform: `scale(${0.3 + spr * 0.7})`,
          }}>
          {text}
        </span>
      );
    }

    case "blur-in": {
      const progress = interpolate(f, [0, 25], [0, 1], {
        ...CLAMP,
        easing: Easing.out(Easing.cubic),
      });
      const blur = interpolate(progress, [0, 1], [20, 0]);
      return (
        <span style={{ ...base, opacity: progress, filter: `blur(${blur}px)` }}>
          {text}
        </span>
      );
    }

    default:
      return <span style={base}>{text}</span>;
  }
};
