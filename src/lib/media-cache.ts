const imageCache = new Map<string, Promise<HTMLImageElement>>();
const videoCache = new Map<string, HTMLVideoElement>();

export function loadImage(url: string): Promise<HTMLImageElement> {
  if (!url) return Promise.reject(new Error("empty url"));
  const existing = imageCache.get(url);
  if (existing) return existing;

  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
  imageCache.set(url, p);
  return p;
}

export function getImageSync(url: string): HTMLImageElement | null {
  if (!url) return null;
  const p = imageCache.get(url);
  if (!p) {
    loadImage(url).catch(() => {});
    return null;
  }
  // `__resolved` is stashed by ensureImageLoaded so preview render loops
  // can read the decoded image synchronously without re-awaiting.
  const cached = (p as unknown as { __resolved?: HTMLImageElement }).__resolved;
  return cached ?? null;
}

export async function ensureImageLoaded(
  url: string,
): Promise<HTMLImageElement> {
  if (!url) throw new Error("empty url");
  const p = loadImage(url);
  const img = await p;
  (p as unknown as { __resolved?: HTMLImageElement }).__resolved = img;
  return img;
}

export function getOrCreateVideo(url: string): HTMLVideoElement {
  const existing = videoCache.get(url);
  if (existing) return existing;
  const v = document.createElement("video");
  v.src = url;
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  v.crossOrigin = "anonymous";
  videoCache.set(url, v);
  return v;
}

export function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const ok = () => {
      video.removeEventListener("loadeddata", ok);
      video.removeEventListener("error", bad);
      resolve();
    };
    const bad = () => {
      video.removeEventListener("loadeddata", ok);
      video.removeEventListener("error", bad);
      reject(new Error("video load failed"));
    };
    video.addEventListener("loadeddata", ok);
    video.addEventListener("error", bad);
  });
}

export function seekVideo(
  video: HTMLVideoElement,
  time: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const target = Math.max(0, Math.min(time, video.duration || time));

    if (Math.abs(video.currentTime - target) < 1e-3) {
      resolve();
      return;
    }

    const ok = () => {
      video.removeEventListener("seeked", ok);
      video.removeEventListener("error", bad);
      resolve();
    };
    const bad = () => {
      video.removeEventListener("seeked", ok);
      video.removeEventListener("error", bad);
      reject(new Error("video seek failed"));
    };
    video.addEventListener("seeked", ok);
    video.addEventListener("error", bad);
    video.currentTime = target;
  });
}

export function clearMediaCache(): void {
  imageCache.clear();
  videoCache.forEach((v) => {
    try {
      v.pause();
      v.removeAttribute("src");
      v.load();
    } catch {
      /* noop */
    }
  });
  videoCache.clear();
}
