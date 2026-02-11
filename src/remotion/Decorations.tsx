import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

export const DiamondBackground: React.FC<{
  accentColor: string;
  backgroundColor: string;
}> = ({ accentColor, backgroundColor }) => {
  const frame = useCurrentFrame();

  const diamonds = [
    { size: 400, bottom: -120, left: -120, opacity: 0.15, delay: 0 },
    { size: 320, bottom: -40, left: -40, opacity: 0.12, delay: 4 },
    { size: 250, bottom: 40, left: 40, opacity: 0.09, delay: 8 },
    { size: 190, bottom: 120, left: 120, opacity: 0.06, delay: 12 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor,
      }}>
      {diamonds.map((d, i) => {
        const progress = interpolate(frame - d.delay, [0, 25], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.back(1.2)),
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              bottom: d.bottom,
              left: d.left,
              width: d.size,
              height: d.size,
              backgroundColor: accentColor,
              opacity: d.opacity * progress,
              transform: `rotate(45deg) scale(${progress})`,
              filter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4,
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 500,
          height: 500,
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          opacity: interpolate(frame, [0, 30], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      />
    </div>
  );
};

export const GridBackground: React.FC<{
  accentColor: string;
  backgroundColor: string;
}> = ({ accentColor, backgroundColor }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 0.06], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor,
        backgroundImage: `
          linear-gradient(${accentColor} 1px, transparent 1px),
          linear-gradient(90deg, ${accentColor} 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        opacity,
      }}
    />
  );
};
