// Full-resolution timeline compositor shared by the live preview and MP4
// export. A frame at the same timestamp always follows the same render path.

import type { Slide, TransitionType } from "../types";
import { getTimelineFrame } from "../engine/renderer";
import { easeInOutPower3 } from "./easing";
import { renderScene, type SceneSize } from "./scene";

interface RenderBuffers {
  outgoing: HTMLCanvasElement;
  outgoingCtx: CanvasRenderingContext2D;
  incoming: HTMLCanvasElement;
  incomingCtx: CanvasRenderingContext2D;
}

const bufferCache = new WeakMap<HTMLCanvasElement, RenderBuffers>();

function createRenderCanvas(
  width: number,
  height: number,
): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Failed to create transition render buffer");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
}

function getRenderBuffers(
  destination: HTMLCanvasElement,
  size: SceneSize,
): RenderBuffers {
  let buffers = bufferCache.get(destination);
  if (!buffers) {
    const outgoing = createRenderCanvas(size.width, size.height);
    const incoming = createRenderCanvas(size.width, size.height);
    buffers = {
      outgoing: outgoing.canvas,
      outgoingCtx: outgoing.ctx,
      incoming: incoming.canvas,
      incomingCtx: incoming.ctx,
    };
    bufferCache.set(destination, buffers);
  }

  if (
    buffers.outgoing.width !== size.width ||
    buffers.outgoing.height !== size.height
  ) {
    buffers.outgoing.width = size.width;
    buffers.outgoing.height = size.height;
    buffers.incoming.width = size.width;
    buffers.incoming.height = size.height;
    buffers.outgoingCtx.imageSmoothingEnabled = true;
    buffers.outgoingCtx.imageSmoothingQuality = "high";
    buffers.incomingCtx.imageSmoothingEnabled = true;
    buffers.incomingCtx.imageSmoothingQuality = "high";
  }

  return buffers;
}

function drawScaled(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  scale: number,
  size: SceneSize,
) {
  const width = size.width * scale;
  const height = size.height * scale;
  ctx.drawImage(
    source,
    (size.width - width) / 2,
    (size.height - height) / 2,
    width,
    height,
  );
}

function compositeTransition(
  ctx: CanvasRenderingContext2D,
  outgoing: HTMLCanvasElement,
  incoming: HTMLCanvasElement,
  type: Exclude<TransitionType, "cut">,
  rawProgress: number,
  size: SceneSize,
) {
  const progress = easeInOutPower3(rawProgress);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size.width, size.height);

  switch (type) {
    case "dissolve":
      ctx.drawImage(outgoing, 0, 0);
      ctx.globalAlpha = progress;
      ctx.drawImage(incoming, 0, 0);
      break;

    case "push-left":
      ctx.drawImage(outgoing, -progress * size.width, 0);
      ctx.drawImage(incoming, (1 - progress) * size.width, 0);
      break;

    case "wipe-left":
      ctx.drawImage(outgoing, 0, 0);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, Math.ceil(size.width * progress), size.height);
      ctx.clip();
      ctx.drawImage(incoming, 0, 0);
      ctx.restore();
      break;

    case "iris": {
      ctx.drawImage(outgoing, 0, 0);
      const radius =
        Math.hypot(size.width / 2, size.height / 2) * progress;
      ctx.save();
      ctx.beginPath();
      ctx.arc(size.width / 2, size.height / 2, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(incoming, 0, 0);
      ctx.restore();
      break;
    }

    case "zoom-through":
      drawScaled(ctx, outgoing, 1 + progress * 0.12, size);
      ctx.globalAlpha = progress;
      drawScaled(ctx, incoming, 0.92 + progress * 0.08, size);
      break;
  }

  ctx.restore();
}

export function renderTimelineFrame(
  ctx: CanvasRenderingContext2D,
  slides: Slide[],
  currentTime: number,
  size: SceneSize,
): void {
  const frame = getTimelineFrame(slides, currentTime);
  if (!frame.active) {
    renderScene(ctx, null, 0, size);
    return;
  }

  if (!frame.previous || !frame.transition) {
    renderScene(ctx, frame.active.slide, frame.active.localTime, size);
    return;
  }

  const buffers = getRenderBuffers(ctx.canvas, size);
  renderScene(
    buffers.outgoingCtx,
    frame.previous.slide,
    frame.previous.localTime,
    size,
  );
  renderScene(
    buffers.incomingCtx,
    frame.active.slide,
    frame.active.localTime,
    size,
  );

  compositeTransition(
    ctx,
    buffers.outgoing,
    buffers.incoming,
    frame.transition.type,
    frame.transition.progress,
    size,
  );
}

