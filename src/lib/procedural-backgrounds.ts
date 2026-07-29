import type {
  BackgroundType,
  ProceduralBackgroundSettings,
} from "../types";
import { DEFAULT_PROCEDURAL_BACKGROUND } from "../types";
import type { SceneSize } from "./scene";

type ProceduralBackgroundType = Extract<
  BackgroundType,
  "gradient-mesh" | "aurora" | "technical-grid"
>;

const NOISE_TILE_SIZE = 64;
const noiseTileCache = new Map<number, HTMLCanvasElement>();
const noisePatternCache = new WeakMap<
  CanvasRenderingContext2D,
  Map<number, CanvasPattern>
>();

function parseHex(color: string): [number, number, number] {
  const value = color.trim().replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(value)) {
    return [
      Number.parseInt(value[0]! + value[0]!, 16),
      Number.parseInt(value[1]! + value[1]!, 16),
      Number.parseInt(value[2]! + value[2]!, 16),
    ];
  }
  if (/^[0-9a-f]{6}$/i.test(value)) {
    return [
      Number.parseInt(value.slice(0, 2), 16),
      Number.parseInt(value.slice(2, 4), 16),
      Number.parseInt(value.slice(4, 6), 16),
    ];
  }
  return [9, 9, 11];
}

function rgba(color: string, alpha: number): string {
  const [r, g, b] = parseHex(color);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function shade(color: string, amount: number): string {
  const [r, g, b] = parseHex(color);
  const factor = Math.max(0, amount);
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
}

function seedUnit(seed: number, index: number): number {
  let value = (Math.trunc(seed) + index * 374_761_393) | 0;
  value = Math.imul(value ^ (value >>> 13), 1_274_126_177);
  return ((value ^ (value >>> 16)) >>> 0) / 4_294_967_295;
}

function fillBase(
  ctx: CanvasRenderingContext2D,
  baseColor: string,
  size: SceneSize,
): void {
  const gradient = ctx.createLinearGradient(0, 0, size.width, size.height);
  gradient.addColorStop(0, shade(baseColor, 0.66));
  gradient.addColorStop(0.52, baseColor);
  gradient.addColorStop(1, shade(baseColor, 0.52));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size.width, size.height);
}

function drawVignette(
  ctx: CanvasRenderingContext2D,
  size: SceneSize,
): void {
  const radius = Math.hypot(size.width, size.height) * 0.62;
  const vignette = ctx.createRadialGradient(
    size.width / 2,
    size.height / 2,
    radius * 0.22,
    size.width / 2,
    size.height / 2,
    radius,
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(0.72, "rgba(0, 0, 0, 0.06)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.48)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size.width, size.height);
}

function getNoiseTile(seed: number): HTMLCanvasElement {
  const normalizedSeed = Math.trunc(seed);
  const cached = noiseTileCache.get(normalizedSeed);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = NOISE_TILE_SIZE;
  canvas.height = NOISE_TILE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const image = ctx.createImageData(NOISE_TILE_SIZE, NOISE_TILE_SIZE);
  for (let pixel = 0; pixel < NOISE_TILE_SIZE * NOISE_TILE_SIZE; pixel++) {
    const value = seedUnit(normalizedSeed, pixel + 91);
    const offset = pixel * 4;
    const light = value > 0.5 ? 255 : 0;
    image.data[offset] = light;
    image.data[offset + 1] = light;
    image.data[offset + 2] = light;
    image.data[offset + 3] = 5 + Math.floor(value * 6);
  }
  ctx.putImageData(image, 0, 0);
  noiseTileCache.set(normalizedSeed, canvas);
  return canvas;
}

function drawDither(
  ctx: CanvasRenderingContext2D,
  seed: number,
  size: SceneSize,
): void {
  let contextPatterns = noisePatternCache.get(ctx);
  if (!contextPatterns) {
    contextPatterns = new Map();
    noisePatternCache.set(ctx, contextPatterns);
  }

  let pattern = contextPatterns.get(seed);
  if (!pattern) {
    pattern = ctx.createPattern(getNoiseTile(seed), "repeat") ?? undefined;
    if (pattern) contextPatterns.set(seed, pattern);
  }
  if (!pattern) return;

  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.restore();
}

function drawGradientMesh(
  ctx: CanvasRenderingContext2D,
  localTime: number,
  size: SceneSize,
  settings: ProceduralBackgroundSettings,
  baseColor: string,
): void {
  fillBase(ctx, baseColor, size);

  const minDimension = Math.min(size.width, size.height);
  const direction = settings.backgroundDirection === "reverse" ? -1 : 1;
  const energy = Math.max(0, Math.min(1, settings.backgroundEnergy));
  const colors = [
    settings.backgroundSecondaryColor,
    settings.backgroundAccentColor,
  ];

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let index = 0; index < 5; index++) {
    const phase = seedUnit(settings.backgroundSeed, index + 1) * Math.PI * 2;
    const speed = 0.12 + seedUnit(settings.backgroundSeed, index + 11) * 0.1;
    const baseX = 0.12 + seedUnit(settings.backgroundSeed, index + 21) * 0.76;
    const baseY = 0.12 + seedUnit(settings.backgroundSeed, index + 31) * 0.76;
    const travel = 0.07 + energy * 0.11;
    const x =
      size.width *
      (baseX +
        Math.sin(localTime * speed * direction + phase) * travel);
    const y =
      size.height *
      (baseY +
        Math.cos(localTime * speed * 0.82 * direction + phase) * travel);
    const radius =
      minDimension *
      settings.backgroundScale *
      (0.42 + seedUnit(settings.backgroundSeed, index + 41) * 0.32);
    const color = colors[index % colors.length]!;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, rgba(color, 0.26 + energy * 0.2));
    glow.addColorStop(0.46, rgba(color, 0.12 + energy * 0.12));
    glow.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  ctx.restore();

  drawVignette(ctx, size);
}

function createAuroraPath(
  ctx: CanvasRenderingContext2D,
  localTime: number,
  size: SceneSize,
  seed: number,
  ribbon: number,
  energy: number,
  direction: number,
): void {
  const phase = seedUnit(seed, ribbon + 60) * Math.PI * 2;
  const baseY = size.height * (0.2 + ribbon * 0.16);
  const drift =
    Math.sin(localTime * (0.12 + ribbon * 0.016) * direction + phase) *
    size.height *
    (0.035 + energy * 0.055);
  const wave = size.height * (0.08 + energy * 0.08);

  ctx.beginPath();
  ctx.moveTo(-size.width * 0.18, baseY + drift);
  ctx.bezierCurveTo(
    size.width * 0.18,
    baseY - wave * Math.sin(phase + localTime * 0.09 * direction),
    size.width * 0.42,
    baseY + wave * Math.cos(phase * 0.7 + localTime * 0.12 * direction),
    size.width * 0.62,
    baseY + drift * 0.55,
  );
  ctx.bezierCurveTo(
    size.width * 0.82,
    baseY - wave * Math.cos(phase + localTime * 0.08 * direction),
    size.width * 1.03,
    baseY + wave * Math.sin(phase * 0.8 + localTime * 0.11 * direction),
    size.width * 1.18,
    baseY - drift,
  );
}

function drawAurora(
  ctx: CanvasRenderingContext2D,
  localTime: number,
  size: SceneSize,
  settings: ProceduralBackgroundSettings,
  baseColor: string,
): void {
  fillBase(ctx, baseColor, size);

  const direction = settings.backgroundDirection === "reverse" ? -1 : 1;
  const energy = Math.max(0, Math.min(1, settings.backgroundEnergy));
  const colors = [
    settings.backgroundSecondaryColor,
    settings.backgroundAccentColor,
  ];
  const ribbonGradient = ctx.createLinearGradient(0, 0, size.width, size.height);
  ribbonGradient.addColorStop(0, rgba(colors[0]!, 0.62));
  ribbonGradient.addColorStop(0.48, rgba(colors[1]!, 0.78));
  ribbonGradient.addColorStop(1, rgba(colors[0]!, 0.55));

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let ribbon = 0; ribbon < 4; ribbon++) {
    createAuroraPath(
      ctx,
      localTime,
      size,
      settings.backgroundSeed,
      ribbon,
      energy,
      direction,
    );
    ctx.strokeStyle = ribbonGradient;
    ctx.globalAlpha = 0.28 + energy * 0.12;
    ctx.lineWidth =
      Math.min(size.width, size.height) *
      settings.backgroundScale *
      (0.18 - ribbon * 0.018);
    ctx.stroke();

    createAuroraPath(
      ctx,
      localTime,
      size,
      settings.backgroundSeed,
      ribbon,
      energy,
      direction,
    );
    ctx.globalAlpha = 0.1 + energy * 0.08;
    ctx.lineWidth =
      Math.min(size.width, size.height) *
      settings.backgroundScale *
      (0.09 - ribbon * 0.008);
    ctx.stroke();
  }
  ctx.restore();

  const lowerFade = ctx.createLinearGradient(0, 0, 0, size.height);
  lowerFade.addColorStop(0, "rgba(0, 0, 0, 0.04)");
  lowerFade.addColorStop(0.58, "rgba(0, 0, 0, 0.06)");
  lowerFade.addColorStop(1, "rgba(0, 0, 0, 0.52)");
  ctx.fillStyle = lowerFade;
  ctx.fillRect(0, 0, size.width, size.height);
  drawVignette(ctx, size);
}

function drawTechnicalGrid(
  ctx: CanvasRenderingContext2D,
  localTime: number,
  size: SceneSize,
  settings: ProceduralBackgroundSettings,
  baseColor: string,
): void {
  fillBase(ctx, baseColor, size);

  const minDimension = Math.min(size.width, size.height);
  const direction = settings.backgroundDirection === "reverse" ? -1 : 1;
  const energy = Math.max(0, Math.min(1, settings.backgroundEnergy));
  const horizon = size.height * 0.42;
  const phase = seedUnit(settings.backgroundSeed, 84) * Math.PI * 2;
  const vanishingX =
    size.width *
    (0.5 +
      Math.sin(localTime * 0.08 * direction + phase) * energy * 0.045);

  const halo = ctx.createRadialGradient(
    vanishingX,
    horizon,
    0,
    vanishingX,
    horizon,
    minDimension * 0.72,
  );
  halo.addColorStop(
    0,
    rgba(settings.backgroundAccentColor, 0.22 + energy * 0.13),
  );
  halo.addColorStop(
    0.34,
    rgba(settings.backgroundSecondaryColor, 0.08 + energy * 0.07),
  );
  halo.addColorStop(1, rgba(settings.backgroundSecondaryColor, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size.width, size.height);

  ctx.save();
  ctx.lineWidth = Math.max(1, minDimension / 1080);
  const gridColor = settings.backgroundSecondaryColor;
  const spacing = minDimension * 0.1 * settings.backgroundScale;
  const lineCount = Math.ceil(size.width / Math.max(24, spacing)) + 8;

  for (let line = -lineCount; line <= lineCount; line++) {
    const bottomX = size.width / 2 + line * spacing;
    ctx.beginPath();
    ctx.moveTo(vanishingX, horizon);
    ctx.lineTo(bottomX, size.height);
    ctx.strokeStyle = rgba(gridColor, line % 4 === 0 ? 0.28 : 0.12);
    ctx.stroke();
  }

  const rowCount = 18;
  const travel =
    ((localTime * (0.11 + energy * 0.16) * direction + phase) % 1 + 1) % 1;
  for (let row = 0; row < rowCount; row++) {
    const p = ((row + travel) % rowCount) / rowCount;
    const eased = p * p;
    const y = horizon + (size.height - horizon) * eased;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size.width, y);
    ctx.strokeStyle = rgba(
      gridColor,
      (row % 5 === 0 ? 0.28 : 0.1) * (0.45 + p * 0.55),
    );
    ctx.stroke();
  }

  ctx.lineWidth = Math.max(1.5, minDimension / 720);
  ctx.strokeStyle = rgba(settings.backgroundAccentColor, 0.42);
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(size.width, horizon);
  ctx.stroke();

  const scanProgress =
    ((localTime * (0.08 + energy * 0.12) * direction + phase * 0.1) % 1 + 1) %
    1;
  const scanY =
    horizon + (size.height - horizon) * scanProgress * scanProgress;
  const scan = ctx.createLinearGradient(0, 0, size.width, 0);
  scan.addColorStop(0, rgba(settings.backgroundAccentColor, 0));
  scan.addColorStop(0.5, rgba(settings.backgroundAccentColor, 0.62));
  scan.addColorStop(1, rgba(settings.backgroundAccentColor, 0));
  ctx.strokeStyle = scan;
  ctx.lineWidth = Math.max(2, minDimension / 420);
  ctx.beginPath();
  ctx.moveTo(0, scanY);
  ctx.lineTo(size.width, scanY);
  ctx.stroke();
  ctx.restore();

  drawVignette(ctx, size);
}

export function renderProceduralBackground(
  ctx: CanvasRenderingContext2D,
  type: ProceduralBackgroundType,
  localTime: number,
  size: SceneSize,
  baseColor: string,
  partialSettings: Partial<ProceduralBackgroundSettings>,
): void {
  const settings: ProceduralBackgroundSettings = {
    ...DEFAULT_PROCEDURAL_BACKGROUND,
    ...partialSettings,
  };

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  if (type === "gradient-mesh") {
    drawGradientMesh(ctx, localTime, size, settings, baseColor);
  } else if (type === "aurora") {
    drawAurora(ctx, localTime, size, settings, baseColor);
  } else {
    drawTechnicalGrid(ctx, localTime, size, settings, baseColor);
  }

  drawDither(ctx, settings.backgroundSeed, size);
  ctx.restore();
}
