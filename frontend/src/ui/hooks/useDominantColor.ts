import { useEffect, useState } from "react";

import { clamp } from "@shared/math";

import { loopbackProxyUrl } from "@/infra/mediaSource";

// Resolved dominant colours per URL (null = couldn't sample — CORS-tainted or load
// error; don't retry). Module-level so it survives re-mounts and track revisits.
const cache = new Map<string, string | null>();

const BINS = 18;

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  const channel = (v: number) =>
    Math.round(clamp(0, 255, (v + m) * 255))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** Dominant VIVID colour of a downscaled image copy (hex), or null if it can't be
 *  read (CORS-tainted) or has no vivid pixels. Buckets pixels into hue bins weighted
 *  by vividness (saturation × mid-lightness) and returns the heaviest bin's mean. */
function extractDominant(img: HTMLImageElement): string | null {
  const size = 28;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size); // throws if the image is CORS-tainted

  const weight = Array.from({ length: BINS }, () => 0);
  const hAcc = Array.from({ length: BINS }, () => 0);
  const sAcc = Array.from({ length: BINS }, () => 0);
  const lAcc = Array.from({ length: BINS }, () => 0);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const { h, s, l } = rgbToHsl(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    if (s < 0.2 || l < 0.12 || l > 0.9) continue; // skip greys / near-black / near-white
    const w = s * (1 - Math.abs(2 * l - 1)); // vividness
    const bin = Math.min(BINS - 1, Math.floor((h / 360) * BINS));
    weight[bin] += w;
    hAcc[bin] += h * w;
    sAcc[bin] += s * w;
    lAcc[bin] += l * w;
  }
  let best = -1;
  let bestW = 0;
  for (let i = 0; i < BINS; i++) {
    if (weight[i] > bestW) {
      bestW = weight[i];
      best = i;
    }
  }
  if (best < 0) return null;
  return hslToHex(
    hAcc[best] / bestW,
    clamp(0, 1, sAcc[best] / bestW),
    clamp(0, 1, lAcc[best] / bestW),
  );
}

/**
 * The dominant vivid colour of an image (hex) for toning UI from artwork. Loads a
 * CORS-anonymous copy and samples it on a small canvas; returns undefined until it
 * resolves and whenever the image can't be sampled (CORS-tainted / load error), so
 * callers fall back to another tone. Cached per URL.
 */
export function useDominantColor(url: string | undefined): string | undefined {
  const [color, setColor] = useState<string | undefined>(() =>
    url ? (cache.get(url) ?? undefined) : undefined,
  );

  useEffect(() => {
    if (!url) {
      setColor(undefined);
      return;
    }
    const cached = cache.get(url);
    if (cached !== undefined) {
      setColor(cached ?? undefined);
      return;
    }
    let cancelled = false;
    // Load through the loopback /stream proxy: remote covers (e.g. NCM) don't send
    // CORS headers, so reading their pixels off a canvas would taint it. The proxy
    // re-serves the bytes with Access-Control-Allow-Origin, keeping the canvas clean.
    void loopbackProxyUrl(url).then((proxied) => {
      if (cancelled) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let hex: string | null = null;
        try {
          hex = extractDominant(img);
        } catch {
          hex = null;
        }
        cache.set(url, hex);
        if (!cancelled) setColor(hex ?? undefined);
      };
      img.onerror = () => {
        cache.set(url, null);
        if (!cancelled) setColor(undefined);
      };
      img.src = proxied;
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return color;
}
