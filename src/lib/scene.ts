// renderScene is the single entrypoint used by both the live preview
// and the WebCodecs export — same inputs produce identical pixels.

import type { Slide, StandardSlide, LogoSlide, TextPosition } from "../types";
import {
  DEFAULT_FONT_FAMILY,
  applyFontStyle,
  layoutText,
  type TextLayout,
} from "./text-layout";
import { animations } from "../animations";
import { logoAnimations } from "../animations/logo";
import type { AnimationRenderContext } from "../animations/types";
import { getImageSync, getOrCreateVideo } from "./media-cache";
import { clamp } from "./easing";
import { renderProceduralBackground } from "./procedural-backgrounds";

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
    const v = getOrCreateVideo(slide.backgroundVideoUrl, slide.id);
    if (v.readyState >= 2 && v.videoWidth > 0) {
      drawCover(ctx, v, v.videoWidth, v.videoHeight, size);
    }
  } else if (
    slide.backgroundType === "gradient-mesh" ||
    slide.backgroundType === "aurora" ||
    slide.backgroundType === "technical-grid"
  ) {
    renderProceduralBackground(
      ctx,
      slide.backgroundType,
      localTime,
      size,
      slide.backgroundColor || "#09090b",
      slide,
    );
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
  const v = getOrCreateVideo(slide.videoUrl, slide.id);
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

const LOGO_CAPTION_GAP_FRACTION = 0.55;
const LOGO_DEFAULT_ASPECT = 1;

function computeLogoLayout(
  slide: LogoSlide,
  size: SceneSize,
  imageAspect: number,
  captionHeight: number,
): {
  logoX: number;
  logoY: number;
  logoW: number;
  logoH: number;
  captionY: number;
} {
  const logoH = size.height * clamp(slide.logoSize, 0.05, 0.85);
  const logoW = logoH * imageAspect;
  const gap = slide.caption
    ? slide.captionFontSize * LOGO_CAPTION_GAP_FRACTION
    : 0;
  const totalH = logoH + (slide.caption ? gap + captionHeight : 0);

  const blockTop = (size.height - totalH) / 2;
  const logoX = (size.width - logoW) / 2;
  const logoY = blockTop;
  const captionY = blockTop + logoH + gap;

  return { logoX, logoY, logoW, logoH, captionY };
}

function renderLogoSlide(
  ctx: CanvasRenderingContext2D,
  slide: LogoSlide,
  localTime: number,
  size: SceneSize,
) {
  drawColorBackground(ctx, slide.backgroundColor || "#000000", size);

  const img = slide.logoImageUrl ? getImageSync(slide.logoImageUrl) : null;
  const aspect =
    img && img.naturalWidth > 0 && img.naturalHeight > 0
      ? img.naturalWidth / img.naturalHeight
      : LOGO_DEFAULT_ASPECT;

  const captionLayout = slide.caption
    ? layoutText(ctx, slide.caption, {
        fontSize: slide.captionFontSize,
        fontWeight: 500,
        lineHeight: 1.3,
        letterSpacingEm: 0,
        maxWidth: size.width * 0.8,
        fontFamily: DEFAULT_FONT_FAMILY,
      })
    : null;

  const { logoX, logoY, logoW, logoH, captionY } = computeLogoLayout(
    slide,
    size,
    aspect,
    captionLayout ? captionLayout.totalHeight : 0,
  );

  const progress =
    slide.durationSeconds > 0
      ? clamp(localTime / slide.durationSeconds, 0, 1)
      : 1;

  const factory = logoAnimations[slide.animation];
  if (factory) {
    const renderer = factory();
    renderer.render({
      ctx,
      image: img,
      imageWidth: img?.naturalWidth ?? 0,
      imageHeight: img?.naturalHeight ?? 0,
      logoX,
      logoY,
      logoW,
      logoH,
      progress,
      size,
    });
  }

  if (captionLayout) {
    const captionAlpha = clamp((progress - 0.25) / 0.5);
    if (captionAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = captionAlpha;
      const captionX = (size.width - captionLayout.totalWidth) / 2;
      drawCaption(ctx, captionLayout, captionX, captionY, slide.textColor);
      ctx.restore();
    }
  }
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  layout: TextLayout,
  blockX: number,
  blockY: number,
  color: string,
) {
  ctx.save();
  applyFontStyle(ctx, layout);
  ctx.fillStyle = color;
  for (const line of layout.lines) {
    const lineX = blockX + (layout.totalWidth - line.width) / 2;
    const lineY = blockY + line.offsetY;
    for (const word of line.words) {
      ctx.fillText(word.text, lineX + word.offsetX, lineY);
    }
  }
  ctx.restore();
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
  } else if (slide.type === "logo") {
    renderLogoSlide(ctx, slide, localTime, size);
  }
}
