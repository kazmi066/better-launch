import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import type { TransitionType } from "../types";

const TRANSITION_FRAMES = 15;

interface TransitionWrapperProps {
  transition: TransitionType;
  durationInFrames: number;
  children: React.ReactNode;
}

export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  transition,
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();

  if (transition === "none") {
    return <>{children}</>;
  }

  const enterProgress = interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const exitProgress = interpolate(
    frame,
    [durationInFrames - TRANSITION_FRAMES, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    }
  );

  let enterStyle: React.CSSProperties = {};
  let exitStyle: React.CSSProperties = {};

  switch (transition) {
    case "fade":
      enterStyle = { opacity: enterProgress };
      exitStyle = { opacity: 1 - exitProgress };
      break;
    case "slide-left":
      enterStyle = {
        opacity: 1,
        transform: `translateX(${(1 - enterProgress) * 100}%)`,
      };
      exitStyle = {
        opacity: 1,
        transform: `translateX(${-exitProgress * 100}%)`,
      };
      break;
    case "slide-right":
      enterStyle = {
        opacity: 1,
        transform: `translateX(${(1 - enterProgress) * -100}%)`,
      };
      exitStyle = {
        opacity: 1,
        transform: `translateX(${exitProgress * 100}%)`,
      };
      break;
    case "slide-up":
      enterStyle = {
        opacity: 1,
        transform: `translateY(${(1 - enterProgress) * 100}%)`,
      };
      exitStyle = {
        opacity: 1,
        transform: `translateY(${-exitProgress * 100}%)`,
      };
      break;
    case "slide-down":
      enterStyle = {
        opacity: 1,
        transform: `translateY(${(1 - enterProgress) * -100}%)`,
      };
      exitStyle = {
        opacity: 1,
        transform: `translateY(${exitProgress * 100}%)`,
      };
      break;
    case "zoom-in":
      enterStyle = {
        opacity: enterProgress,
        transform: `scale(${0.5 + enterProgress * 0.5})`,
      };
      exitStyle = {
        opacity: 1 - exitProgress,
        transform: `scale(${1 + exitProgress * 0.5})`,
      };
      break;
    case "zoom-out":
      enterStyle = {
        opacity: enterProgress,
        transform: `scale(${1.5 - enterProgress * 0.5})`,
      };
      exitStyle = {
        opacity: 1 - exitProgress,
        transform: `scale(${1 - exitProgress * 0.5})`,
      };
      break;
    case "wipe-left":
      enterStyle = {
        clipPath: `inset(0 ${(1 - enterProgress) * 100}% 0 0)`,
      };
      exitStyle = {
        clipPath: `inset(0 0 0 ${exitProgress * 100}%)`,
      };
      break;
    case "wipe-right":
      enterStyle = {
        clipPath: `inset(0 0 0 ${(1 - enterProgress) * 100}%)`,
      };
      exitStyle = {
        clipPath: `inset(0 ${exitProgress * 100}% 0 0)`,
      };
      break;
  }

  const isEntering = frame < TRANSITION_FRAMES;
  const isExiting = frame > durationInFrames - TRANSITION_FRAMES;
  const style = isExiting ? exitStyle : isEntering ? enterStyle : {};

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
