import { QuantizerCelebi, Score, hexFromArgb } from "@material/material-color-utilities";

import { errorMessage, warn } from "@shared/debug";

import { loopbackProxyUrl } from "@/infra/mediaSource";
import { sampleCoverParticles, type CoverParticles } from "@/model/stage-particles";

// Imperative cover loaders for effects (which aren't React components, so no hooks).
// Each is a synchronous cache peek that kicks a background load on a miss: returns
// undefined while loading, null once resolved to "no usable value", or the value
// itself. Loads go through the loopback proxy so remote covers (no CORS headers)
// don't taint the canvas we read pixels from. This keeps cover fetching on the
// DRAWING side — the audio engine never touches it.
//
// A load/decode/CORS failure is NOT memoized permanently: it is retried after a
// short cooldown. A transient startup race (Wails bridge or media server not ready
// when the first cover loads) or a network blip would otherwise poison a cover — and
// with it the whole particle/palette effect — for the rest of the session.

async function loadImage(url: string): Promise<HTMLImageElement> {
  const proxied = await loopbackProxyUrl(url);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = proxied;
  });
}

const RETRY_COOLDOWN_MS = 2000;

// One peek-cache per derived cover value. `resolved` holds a settled answer (the
// value, or null for "loaded fine but nothing usable"); `failedAt` holds the last
// failure time so a retryable load (CORS taint / load error) waits out the cooldown
// instead of hammering every frame or sticking forever.
type CoverCache<T> = {
  readonly label: string;
  readonly resolved: Map<string, T | null>;
  readonly pending: Set<string>;
  readonly failedAt: Map<string, number>;
  readonly derive: (img: HTMLImageElement) => T | null;
};

function newCoverCache<T>(
  label: string,
  derive: (img: HTMLImageElement) => T | null,
): CoverCache<T> {
  return { label, derive, resolved: new Map(), pending: new Set(), failedAt: new Map() };
}

function peekCover<T>(url: string | undefined, cache: CoverCache<T>): T | null | undefined {
  if (!url) return undefined;
  if (cache.resolved.has(url)) return cache.resolved.get(url);
  if (cache.pending.has(url)) return undefined;
  const failedAt = cache.failedAt.get(url);
  if (failedAt !== undefined && performance.now() - failedAt < RETRY_COOLDOWN_MS) return undefined;

  cache.pending.add(url);
  void loadImage(url)
    .then((img) => {
      // derive() reads canvas pixels and throws on a CORS-tainted source — that's a
      // retryable failure (proxy not ready), not a genuine "nothing usable" (null).
      cache.resolved.set(url, cache.derive(img));
      cache.failedAt.delete(url);
    })
    .catch((error: unknown) => {
      cache.failedAt.set(url, performance.now());
      warn(`visualizer ${cache.label} cover unavailable: ${errorMessage(error)}`);
    })
    .finally(() => cache.pending.delete(url));
  return undefined;
}

// ── Ranked theme colours (Material 3 content-based) ──────────────────────────
const MAX_COLORS = 4;

function extractColors(img: HTMLImageElement): readonly string[] | null {
  const size = 52;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size); // throws if CORS-tainted

  const pixels: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 255) continue;
    pixels.push(((255 << 24) | (data[i] << 16) | (data[i + 1] << 8) | data[i + 2]) >>> 0);
  }
  if (pixels.length === 0) return null;

  const ranked = Score.score(QuantizerCelebi.quantize(pixels, 64));
  if (!ranked.length) return null;
  return ranked.slice(0, MAX_COLORS).map((argb) => hexFromArgb(argb));
}

const colorsCache = newCoverCache("palette", extractColors);

/** Ranked theme colours of a cover (peek + background load). undefined = loading/none. */
export function coverColors(url: string | undefined): readonly string[] | null | undefined {
  return peekCover(url, colorsCache);
}

// ── Cover as a particle cloud ────────────────────────────────────────────────
const GRID = 80;
const SAMPLE_SIZE = 128;

function sampleParticles(img: HTMLImageElement): CoverParticles | null {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE); // throws if CORS-tainted
  return sampleCoverParticles(data, SAMPLE_SIZE, SAMPLE_SIZE, GRID);
}

const particlesCache = newCoverCache("particles", sampleParticles);

/** Cover sampled into a particle cloud (peek + background load). undefined = loading/none. */
export function coverParticles(url: string | undefined): CoverParticles | null | undefined {
  return peekCover(url, particlesCache);
}
