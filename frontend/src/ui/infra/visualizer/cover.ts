import { QuantizerCelebi, Score, hexFromArgb } from "@material/material-color-utilities";

import { loopbackProxyUrl } from "@/infra/mediaSource";
import { sampleCoverParticles, type CoverParticles } from "@/model/stage-particles";

// Imperative cover loaders for effects (which aren't React components, so no hooks).
// Each is a synchronous cache peek that kicks a background load on a miss: returns
// undefined while loading, null when the image can't be read (CORS-tainted / error),
// or the value once resolved. Loads go through the loopback proxy so remote covers
// (no CORS headers) don't taint the canvas we read pixels from. This keeps cover
// fetching on the DRAWING side — the audio engine never touches it.

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

// ── Ranked theme colours (Material 3 content-based) ──────────────────────────
const MAX_COLORS = 4;
const colorsCache = new Map<string, readonly string[] | null>();
const colorsPending = new Set<string>();

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

/** Ranked theme colours of a cover (peek + background load). undefined = loading/none. */
export function coverColors(url: string | undefined): readonly string[] | null | undefined {
  if (!url) return undefined;
  if (colorsCache.has(url)) return colorsCache.get(url);
  if (!colorsPending.has(url)) {
    colorsPending.add(url);
    void loadImage(url)
      .then((img) => {
        let result: readonly string[] | null = null;
        try {
          result = extractColors(img);
        } catch {
          result = null;
        }
        colorsCache.set(url, result);
      })
      .catch(() => colorsCache.set(url, null))
      .finally(() => colorsPending.delete(url));
  }
  return undefined;
}

// ── Cover as a particle cloud ────────────────────────────────────────────────
const GRID = 80;
const SAMPLE_SIZE = 128;
const particlesCache = new Map<string, CoverParticles | null>();
const particlesPending = new Set<string>();

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

/** Cover sampled into a particle cloud (peek + background load). undefined = loading/none. */
export function coverParticles(url: string | undefined): CoverParticles | null | undefined {
  if (!url) return undefined;
  if (particlesCache.has(url)) return particlesCache.get(url);
  if (!particlesPending.has(url)) {
    particlesPending.add(url);
    void loadImage(url)
      .then((img) => {
        let result: CoverParticles | null = null;
        try {
          result = sampleParticles(img);
        } catch {
          result = null;
        }
        particlesCache.set(url, result);
      })
      .catch(() => particlesCache.set(url, null))
      .finally(() => particlesPending.delete(url));
  }
  return undefined;
}
