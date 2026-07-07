import { useEffect, useState } from "react";

import { QuantizerCelebi, Score, hexFromArgb } from "@material/material-color-utilities";

import { loopbackProxyUrl } from "@/infra/mediaSource";

/** Cover's ranked theme colours (hex), most prominent first (1–4). */
export type CoverColors = readonly string[];

const MAX_COLORS = 4;

// Resolved colours per URL (null = couldn't sample — CORS-tainted or load error;
// don't retry). Module-level so it survives re-mounts and track revisits.
const cache = new Map<string, CoverColors | null>();

/** Material 3 content-based theme colours of a downscaled image copy — the top
 *  ranked source colours (up to MAX_COLORS), or null if it can't be read
 *  (CORS-tainted). Celebi quantization → Score ranks by chroma + population,
 *  avoiding disliked/near-grey hues (the Material You wallpaper-theming pipeline). */
function extractColors(img: HTMLImageElement): CoverColors | null {
  const size = 52;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size); // throws if the image is CORS-tainted

  const pixels: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 255) continue; // skip transparent
    pixels.push(((255 << 24) | (data[i] << 16) | (data[i + 1] << 8) | data[i + 2]) >>> 0);
  }
  if (pixels.length === 0) return null;

  const ranked = Score.score(QuantizerCelebi.quantize(pixels, 64));
  if (!ranked.length) return null;
  return ranked.slice(0, MAX_COLORS).map((argb) => hexFromArgb(argb));
}

/**
 * The Material 3 content-based theme colours of an image (ranked hex, up to
 * MAX_COLORS) for toning UI from artwork — same source as the page backdrop.
 * Loads a CORS-anonymous copy through the loopback proxy and runs the M3
 * quantize→score pipeline; returns undefined until it resolves and whenever the
 * image can't be sampled, so callers fall back to another tone. Cached per URL.
 */
export function useCoverColors(url: string | undefined): CoverColors | undefined {
  const [colors, setColors] = useState<CoverColors | undefined>(() =>
    url ? (cache.get(url) ?? undefined) : undefined,
  );

  useEffect(() => {
    if (!url) {
      setColors(undefined);
      return;
    }
    const cached = cache.get(url);
    if (cached !== undefined) {
      setColors(cached ?? undefined);
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
        let result: CoverColors | null = null;
        try {
          result = extractColors(img);
        } catch {
          result = null;
        }
        cache.set(url, result);
        if (!cancelled) setColors(result ?? undefined);
      };
      img.onerror = () => {
        cache.set(url, null);
        if (!cancelled) setColors(undefined);
      };
      img.src = proxied;
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return colors;
}
