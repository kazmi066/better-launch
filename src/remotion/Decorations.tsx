import React, { useMemo } from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import type { BackgroundAnimation } from "../types";

interface BgProps {
  accentColor: string;
  backgroundColor: string;
}

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const DiamondBackground: React.FC<BgProps> = ({
  accentColor,
  backgroundColor,
}) => {
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
          ...CLAMP,
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

const GridBackground: React.FC<BgProps> = ({
  accentColor,
  backgroundColor,
}) => {
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

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

const ParticlesBackground: React.FC<BgProps> = ({
  accentColor,
  backgroundColor,
}) => {
  const frame = useCurrentFrame();

  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      x: seededRandom(i * 3 + 1) * 100,
      y: seededRandom(i * 3 + 2) * 100,
      size: 2 + seededRandom(i * 3 + 3) * 4,
      speed: 0.3 + seededRandom(i * 7) * 0.7,
      delay: Math.floor(seededRandom(i * 5) * 30),
      drift: (seededRandom(i * 11) - 0.5) * 40,
    }));
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor,
      }}>
      {particles.map((p, i) => {
        const life = interpolate(frame - p.delay, [0, 20], [0, 1], CLAMP);
        const float = Math.sin((frame + i * 17) * 0.04 * p.speed) * 12;
        const driftX = interpolate(frame, [0, 150], [0, p.drift], {
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: accentColor,
              opacity: life * (0.15 + seededRandom(i * 13) * 0.35),
              transform: `translate(${driftX}px, ${float}px) scale(${life})`,
              boxShadow: `0 0 ${p.size * 3}px ${accentColor}44`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          width: 600,
          height: 600,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${accentColor}15 0%, transparent 60%)`,
          opacity: interpolate(frame, [0, 40], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      />
    </div>
  );
};

const AuroraBackground: React.FC<BgProps> = ({
  accentColor,
  backgroundColor,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 30], [0, 1], CLAMP);

  const wave1 = Math.sin(frame * 0.03) * 60;
  const wave2 = Math.cos(frame * 0.025) * 80;
  const wave3 = Math.sin(frame * 0.02 + 2) * 50;

  const shift1 = interpolate(frame, [0, 150], [0, 120], {
    extrapolateRight: "clamp",
  });
  const shift2 = interpolate(frame, [0, 150], [0, -80], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor,
      }}>
      <div
        style={{
          position: "absolute",
          top: -200 + wave1,
          left: -300 + shift1,
          width: 1200,
          height: 600,
          background: `linear-gradient(135deg, ${accentColor}30, transparent 60%)`,
          borderRadius: "50%",
          filter: "blur(80px)",
          opacity: fadeIn * 0.7,
          transform: `rotate(${frame * 0.3}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -250 + wave2,
          right: -200 + shift2,
          width: 1000,
          height: 500,
          background: `linear-gradient(225deg, ${accentColor}25, transparent 55%)`,
          borderRadius: "50%",
          filter: "blur(100px)",
          opacity: fadeIn * 0.5,
          transform: `rotate(${-frame * 0.2}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "30%",
          width: 800,
          height: 400,
          background: `radial-gradient(ellipse, ${accentColor}18, transparent 70%)`,
          borderRadius: "50%",
          filter: "blur(60px)",
          opacity: fadeIn * 0.4,
          transform: `translateY(${wave3}px) scaleX(${1 + Math.sin(frame * 0.015) * 0.2})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, transparent 0%, ${backgroundColor}88 100%)`,
        }}
      />
    </div>
  );
};

const RippleBackground: React.FC<BgProps> = ({
  accentColor,
  backgroundColor,
}) => {
  const frame = useCurrentFrame();

  const ripples = useMemo(
    () => [
      { cx: "25%", cy: "60%", delay: 0, maxSize: 900 },
      { cx: "75%", cy: "40%", delay: 12, maxSize: 800 },
      { cx: "50%", cy: "50%", delay: 24, maxSize: 1000 },
      { cx: "30%", cy: "30%", delay: 36, maxSize: 700 },
      { cx: "70%", cy: "70%", delay: 48, maxSize: 850 },
    ],
    [],
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor,
      }}>
      {ripples.map((r, i) => {
        const t = Math.max(0, frame - r.delay);
        const expand = interpolate(t, [0, 60], [0, 1], CLAMP);
        const size = expand * r.maxSize;
        const opacity = interpolate(expand, [0, 0.3, 1], [0, 0.2, 0], CLAMP);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: r.cx,
              top: r.cy,
              width: size,
              height: size,
              borderRadius: "50%",
              border: `2px solid ${accentColor}`,
              opacity,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: "25%",
          top: "60%",
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: accentColor,
          opacity: interpolate(frame, [0, 15], [0, 0.6], CLAMP),
          transform: "translate(-50%, -50%)",
          boxShadow: `0 0 20px ${accentColor}66, 0 0 60px ${accentColor}22`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "75%",
          top: "40%",
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: accentColor,
          opacity: interpolate(frame - 12, [0, 15], [0, 0.4], CLAMP),
          transform: "translate(-50%, -50%)",
          boxShadow: `0 0 15px ${accentColor}44`,
        }}
      />
    </div>
  );
};

const ConstellationBackground: React.FC<BgProps> = ({
  accentColor,
  backgroundColor,
}) => {
  const frame = useCurrentFrame();

  const stars = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        x: seededRandom(i * 7 + 1) * 100,
        y: seededRandom(i * 7 + 2) * 100,
        size: 2 + seededRandom(i * 7 + 3) * 3,
        delay: Math.floor(seededRandom(i * 7 + 4) * 25),
        pulse: 0.5 + seededRandom(i * 7 + 5) * 0.5,
      })),
    [],
  );

  const connections = useMemo(() => {
    const conns: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      delay: number;
    }[] = [];
    stars.forEach((a, i) => {
      stars.forEach((b, j) => {
        if (j <= i) return;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (Math.sqrt(dx * dx + dy * dy) < 25) {
          conns.push({
            x1: a.x,
            y1: a.y,
            x2: b.x,
            y2: b.y,
            delay: Math.max(a.delay, b.delay) + 5,
          });
        }
      });
    });
    return conns;
  }, [stars]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor,
      }}>
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}>
        {connections.map((c, i) => {
          const lineOpacity = interpolate(
            frame - c.delay,
            [0, 20],
            [0, 0.15],
            CLAMP,
          );
          return (
            <line
              key={`l-${i}`}
              x1={`${c.x1}%`}
              y1={`${c.y1}%`}
              x2={`${c.x2}%`}
              y2={`${c.y2}%`}
              stroke={accentColor}
              strokeWidth={1}
              opacity={lineOpacity}
            />
          );
        })}
      </svg>
      {stars.map((s, i) => {
        const appear = interpolate(frame - s.delay, [0, 15], [0, 1], CLAMP);
        const pulse = 0.7 + Math.sin((frame + i * 20) * 0.08) * 0.3 * s.pulse;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              backgroundColor: accentColor,
              opacity: appear * pulse * 0.6,
              transform: `translate(-50%, -50%) scale(${appear})`,
              boxShadow: `0 0 ${s.size * 4}px ${accentColor}33`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "60%",
          width: 500,
          height: 500,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${accentColor}10 0%, transparent 60%)`,
          opacity: interpolate(frame, [0, 40], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      />
    </div>
  );
};

const BG_MAP: Record<BackgroundAnimation, React.FC<BgProps>> = {
  diamonds: DiamondBackground,
  grid: GridBackground,
  particles: ParticlesBackground,
  aurora: AuroraBackground,
  ripple: RippleBackground,
  constellation: ConstellationBackground,
};

export const SlideBackground: React.FC<
  BgProps & { animation: BackgroundAnimation }
> = ({ animation, ...props }) => {
  const Component = BG_MAP[animation];
  return <Component {...props} />;
};

export { GridBackground };
