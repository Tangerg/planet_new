import { QuantizerCelebi, Score, hexFromArgb } from "@material/material-color-utilities";

import { errorMessage, warn } from "@shared/debug";

import { loopbackProxyUrl } from "@/infra/mediaSource";
import { sampleCoverParticles, type CoverParticles } from "@/model/stage-particles";

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

const MAX_COLORS = 4;

function extractColors(img: HTMLImageElement): readonly string[] | null {
  const size = 52;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

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

export function coverColors(url: string | undefined): readonly string[] | null | undefined {
  return peekCover(url, colorsCache);
}

const GRID = 80;
const SAMPLE_SIZE = 128;

function sampleParticles(img: HTMLImageElement): CoverParticles | null {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  return sampleCoverParticles(data, SAMPLE_SIZE, SAMPLE_SIZE, GRID);
}

const particlesCache = newCoverCache("particles", sampleParticles);

export function coverParticles(url: string | undefined): CoverParticles | null | undefined {
  return peekCover(url, particlesCache);
}
