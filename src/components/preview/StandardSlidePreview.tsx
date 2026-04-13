import React, { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import type { StandardSlide } from "../../types";
import { animations } from "../../animations";
import { positionToFlex } from "../PositionGrid";

interface Props {
  slide: StandardSlide;
  progress: number;
  isExporting?: boolean;
  exportScale?: number;
}

export const StandardSlidePreview: React.FC<Props> = ({
  slide,
  progress,
  isExporting = false,
  exportScale = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const subheadingRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const prevAnimType = useRef(slide.textAnimation);
  const prevHeading = useRef(slide.heading);
  const prevSubheading = useRef(slide.subheading);

  const buildTimeline = useCallback(() => {
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }

    if (!containerRef.current || !headingRef.current) return;

    headingRef.current.textContent = slide.heading;
    if (subheadingRef.current) {
      subheadingRef.current.textContent = slide.subheading;
    }

    const factory = animations[slide.textAnimation];
    if (!factory) return;

    const tl = factory({
      container: containerRef.current,
      headingEl: headingRef.current,
      subheadingEl: slide.subheading ? subheadingRef.current : null,
    });

    tlRef.current = tl;
    tl.progress(progress);
  }, [slide.textAnimation, slide.heading, slide.subheading, progress]);

  useEffect(() => {
    const needsRebuild =
      prevAnimType.current !== slide.textAnimation ||
      prevHeading.current !== slide.heading ||
      prevSubheading.current !== slide.subheading;

    if (needsRebuild || !tlRef.current) {
      prevAnimType.current = slide.textAnimation;
      prevHeading.current = slide.heading;
      prevSubheading.current = slide.subheading;

      if (isExporting) {
        // Defer during export to ensure DOM is fully laid out with scaled fonts
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            buildTimeline();
          });
        });
      } else {
        buildTimeline();
      }
    }
  }, [
    slide.textAnimation,
    slide.heading,
    slide.subheading,
    buildTimeline,
    isExporting,
  ]);

  useEffect(() => {
    if (tlRef.current) {
      if (isExporting) {
        tlRef.current.progress(progress);
      } else {
        gsap.to(tlRef.current, {
          progress,
          duration: 0.05,
          overwrite: true,
        });
      }
    }
  }, [progress, isExporting]);

  useEffect(() => {
    return () => {
      tlRef.current?.kill();
    };
  }, []);

  const positionStyle = positionToFlex(slide.textPosition);

  const backgroundStyle: React.CSSProperties = {};
  if (slide.backgroundType === "color") {
    backgroundStyle.backgroundColor = slide.backgroundColor;
  }

  const headingFontSize = isExporting
    ? slide.fontSize * exportScale
    : slide.fontSize;
  const subheadingFontSize = isExporting
    ? Math.round(slide.fontSize * 0.45 * exportScale)
    : Math.round(slide.fontSize * 0.45);
  const subheadingMarginTop = isExporting
    ? Math.round(slide.fontSize * 0.25 * exportScale)
    : Math.round(slide.fontSize * 0.25);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={backgroundStyle}>
      {slide.backgroundType === "image" && slide.backgroundImageUrl && (
        <img
          src={slide.backgroundImageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {slide.backgroundType === "video" && slide.backgroundVideoUrl && (
        <video
          src={slide.backgroundVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <div style={positionStyle}>
        <div
          ref={headingRef}
          style={{
            color: slide.textColor,
            fontSize: `${headingFontSize}px`,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}>
          {slide.heading}
        </div>

        {slide.subheading && (
          <div
            ref={subheadingRef}
            style={{
              color: slide.textColor,
              fontSize: `${subheadingFontSize}px`,
              fontWeight: 400,
              lineHeight: 1.4,
              marginTop: `${subheadingMarginTop}px`,
              opacity: 0.7,
            }}>
            {slide.subheading}
          </div>
        )}
      </div>
    </div>
  );
};
