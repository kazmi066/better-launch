export interface LaidOutWord {
  text: string;
  offsetX: number;
  width: number;
}

export interface LaidOutLine {
  words: LaidOutWord[];
  text: string;
  width: number;
  offsetY: number;
}

export interface TextLayout {
  lines: LaidOutLine[];
  totalWidth: number;
  totalHeight: number;
  lineHeightPx: number;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  letterSpacingPx: number;
}

export interface LayoutOptions {
  fontSize: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacingEm?: number;
  maxWidth: number;
  fontFamily?: string;
}

export const DEFAULT_FONT_FAMILY =
  'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export function buildFont(
  fontSize: number,
  fontWeight: number,
  fontFamily: string,
): string {
  return `${fontWeight} ${Math.round(fontSize)}px ${fontFamily}`;
}

export function applyFontStyle(
  ctx: CanvasRenderingContext2D,
  layout: Pick<
    TextLayout,
    "fontSize" | "fontWeight" | "fontFamily" | "letterSpacingPx"
  >,
): void {
  ctx.font = buildFont(layout.fontSize, layout.fontWeight, layout.fontFamily);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  // letterSpacing affects both measureText and fillText, so applying it
  // consistently before measurement is what keeps word geometry stable.
  const anyCtx = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ("letterSpacing" in anyCtx) {
    anyCtx.letterSpacing = `${layout.letterSpacingPx}px`;
  }
}

export function layoutText(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: LayoutOptions,
): TextLayout {
  const fontSize = opts.fontSize;
  const fontWeight = opts.fontWeight ?? 700;
  const lineHeightMul = opts.lineHeight ?? 1.1;
  const lineHeightPx = fontSize * lineHeightMul;
  const fontFamily = opts.fontFamily ?? DEFAULT_FONT_FAMILY;
  const letterSpacingPx = (opts.letterSpacingEm ?? 0) * fontSize;

  const layout: TextLayout = {
    lines: [],
    totalWidth: 0,
    totalHeight: 0,
    lineHeightPx,
    fontSize,
    fontWeight,
    fontFamily,
    letterSpacingPx,
  };

  applyFontStyle(ctx, layout);

  const spaceWidth = ctx.measureText(" ").width;
  const paragraphs = text.split(/\r?\n/);

  let cursorY = 0;

  const flushLine = (words: LaidOutWord[], width: number) => {
    layout.lines.push({
      words,
      text: words.map((w) => w.text).join(" "),
      width,
      offsetY: cursorY,
    });
    if (width > layout.totalWidth) layout.totalWidth = width;
    cursorY += lineHeightPx;
  };

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      flushLine([], 0);
      continue;
    }

    let line: LaidOutWord[] = [];
    let lineWidth = 0;

    for (const word of words) {
      const wordWidth = ctx.measureText(word).width;
      const withSpace =
        lineWidth === 0 ? wordWidth : lineWidth + spaceWidth + wordWidth;

      if (withSpace > opts.maxWidth && line.length > 0) {
        flushLine(line, lineWidth);
        line = [{ text: word, offsetX: 0, width: wordWidth }];
        lineWidth = wordWidth;
      } else {
        const offsetX = lineWidth === 0 ? 0 : lineWidth + spaceWidth;
        line.push({ text: word, offsetX, width: wordWidth });
        lineWidth = withSpace;
      }
    }

    if (line.length > 0) flushLine(line, lineWidth);
  }

  layout.totalHeight = cursorY;
  return layout;
}
