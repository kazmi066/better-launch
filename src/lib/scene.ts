// renderScene is the single entrypoint used by both the live preview
// and the WebCodecs export — same inputs produce identical pixels.

import type { Slide, StandardSlide, TextPosition } from "../types";
import {
  DEFAULT_FONT_FAMILY,
  layoutText,
  type TextLayout,
} from "./text-layout";
import { animations } from "../animations";
import type { AnimationRenderContext } from "../animations/types";
import { getImageSync, getOrCreateVideo } from "./media-cache";
import { clamp } from "./easing";

export interface SceneSize {
  width: number;
  height: number;
}

const TEXT_PADDING_FRACTION = 0.08;
const SUBHEADING_FONT_SCALE = 0.45;
const SUBHEADING_GAP_FRACTION = 0.25;
const HEADING_TRACKING_EM = -0.02;

function drawColorBackground(
  ctx: CanvasRenderingContext2D,
  color: string,
  size: SceneSize,
) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size.width, size.height);
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  srcW: number,
  srcH: number,
  size: SceneSize,
) {
  if (srcW <= 0 || srcH <= 0) return;
  const scale = Math.max(size.width / srcW, size.height / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  const dx = (size.width - dw) / 2;
  const dy = (size.height - dh) / 2;
  ctx.drawImage(src, dx, dy, dw, dh);
}

interface TextBlockGeometry {
  x: number;
  y: number;
}

function computeBlockOrigin(
  position: TextPosition,
  contentBox: { x: number; y: number; width: number; height: number },
  blockWidth: number,
  blockHeight: number,
): TextBlockGeometry {
  const [vertical, horizontal] = position.split("-") as [string, string];

  let x = contentBox.x;
  if (horizontal === "center")
    x = contentBox.x + (contentBox.width - blockWidth) / 2;
  else if (horizontal === "right")
    x = contentBox.x + contentBox.width - blockWidth;

  let y = contentBox.y;
  if (vertical === "middle")
    y = contentBox.y + (contentBox.height - blockHeight) / 2;
  else if (vertical === "bottom")
    y = contentBox.y + contentBox.height - blockHeight;

  return { x, y };
}

function positionToTextAlign(
  position: TextPosition,
): "left" | "center" | "right" {
  const [, horizontal] = position.split("-");
  if (horizontal === "center") return "center";
  if (horizontal === "right") return "right";
  return "left";
}

export function measureStandardSlideLayout(
  ctx: CanvasRenderingContext2D,
  slide: StandardSlide,
  size: SceneSize,
): {
  heading: TextLayout;
  subheading: TextLayout | null;
  headingOrigin: TextBlockGeometry;
  subheadingOrigin: TextBlockGeometry;
} {
  const padding = Math.min(size.width, size.height) * TEXT_PADDING_FRACTION;
  const contentBox = {
    x: padding,
    y: padding,
    width: size.width - padding * 2,
    height: size.height - padding * 2,
  };

  const heading = layoutText(ctx, slide.heading, {
    fontSize: slide.fontSize,
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacingEm: HEADING_TRACKING_EM,
    maxWidth: contentBox.width,
    fontFamily: DEFAULT_FONT_FAMILY,
  });

  let subheading: TextLayout | null = null;
  if (slide.subheading) {
    const subFontSize = Math.round(slide.fontSize * SUBHEADING_FONT_SCALE);
    subheading = layoutText(ctx, slide.subheading, {
      fontSize: subFontSize,
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacingEm: 0,
      maxWidth: contentBox.width,
      fontFamily: DEFAULT_FONT_FAMILY,
    });
  }

  const gap = subheading ? slide.fontSize * SUBHEADING_GAP_FRACTION : 0;
  const totalHeight =
    heading.totalHeight + (subheading ? gap + subheading.totalHeight : 0);
  const totalWidth = Math.max(
    heading.totalWidth,
    subheading ? subheading.totalWidth : 0,
  );

  const blockOrigin = computeBlockOrigin(
    slide.textPosition,
    contentBox,
    totalWidth,
    totalHeight,
  );

  const horizontalAlign = positionToTextAlign(slide.textPosition);

  const headingOriginX =
    horizontalAlign === "center"
      ? blockOrigin.x + (totalWidth - heading.totalWidth) / 2
      : horizontalAlign === "right"
        ? blockOrigin.x + totalWidth - heading.totalWidth
        : blockOrigin.x;
  const headingOrigin: TextBlockGeometry = {
    x: headingOriginX,
    y: blockOrigin.y,
  };

  let subheadingOrigin: TextBlockGeometry = { x: 0, y: 0 };
  if (subheading) {
    const subOriginX =
      horizontalAlign === "center"
        ? blockOrigin.x + (totalWidth - subheading.totalWidth) / 2
        : horizontalAlign === "right"
          ? blockOrigin.x + totalWidth - subheading.totalWidth
          : blockOrigin.x;
    subheadingOrigin = {
      x: subOriginX,
      y: blockOrigin.y + heading.totalHeight + gap,
    };
  }

  return { heading, subheading, headingOrigin, subheadingOrigin };
}

function renderStandardSlide(
  ctx: CanvasRenderingContext2D,
  slide: StandardSlide,
  localTime: number,
  size: SceneSize,
) {
  if (slide.backgroundType === "color") {
    drawColorBackground(ctx, slide.backgroundColor || "#000000", size);
  } else if (slide.backgroundType === "image" && slide.backgroundImageUrl) {
    drawColorBackground(ctx, "#000000", size);
    const img = getImageSync(slide.backgroundImageUrl);
    if (img) drawCover(ctx, img, img.naturalWidth, img.naturalHeight, size);
  } else if (slide.backgroundType === "video" && slide.backgroundVideoUrl) {
    drawColorBackground(ctx, "#000000", size);
    const v = getOrCreateVideo(slide.backgroundVideoUrl);
    if (v.readyState >= 2 && v.videoWidth > 0) {
      drawCover(ctx, v, v.videoWidth, v.videoHeight, size);
    }
  } else {
    drawColorBackground(ctx, "#000000", size);
  }

  const { heading, subheading, headingOrigin, subheadingOrigin } =
    measureStandardSlideLayout(ctx, slide, size);

  const factory = animations[slide.textAnimation];
  if (!factory) return;
  const renderer = factory();

  const progress =
    slide.durationSeconds > 0
      ? clamp(localTime / slide.durationSeconds, 0, 1)
      : 1;

  const animCtx: AnimationRenderContext = {
    ctx,
    heading,
    subheading,
    headingX: headingOrigin.x,
    headingY: headingOrigin.y,
    subheadingX: subheadingOrigin.x,
    subheadingY: subheadingOrigin.y,
    textAlign: positionToTextAlign(slide.textPosition),
    textColor: slide.textColor || "#ffffff",
    progress,
  };

  renderer.render(animCtx);
}

function renderVideoSlide(
  ctx: CanvasRenderingContext2D,
  slide: Extract<Slide, { type: "video" }>,
  _localTime: number,
  size: SceneSize,
) {
  drawColorBackground(ctx, "#000000", size);
  if (!slide.videoUrl) return;
  const v = getOrCreateVideo(slide.videoUrl);
  if (v.readyState >= 2 && v.videoWidth > 0) {
    const scale = Math.min(
      size.width / v.videoWidth,
      size.height / v.videoHeight,
    );
    const dw = v.videoWidth * scale;
    const dh = v.videoHeight * scale;
    const dx = (size.width - dw) / 2;
    const dy = (size.height - dh) / 2;
    ctx.drawImage(v, dx, dy, dw, dh);
  }
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  slide: Slide | null,
  localTime: number,
  size: SceneSize,
): void {
  drawColorBackground(ctx, "#000000", size);
  if (!slide) return;

  if (slide.type === "standard") {
    renderStandardSlide(ctx, slide, localTime, size);
  } else if (slide.type === "video") {
    renderVideoSlide(ctx, slide, localTime, size);
  }
}
