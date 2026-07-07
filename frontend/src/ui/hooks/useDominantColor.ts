import { useEffect, useState } from "react";

import { QuantizerCelebi, Score, hexFromArgb } from "@material/material-color-utilities";

import { loopbackProxyUrl } from "@/infra/mediaSource";

// Resolved source colours per URL (null = couldn't sample — CORS-tainted or load
// error; don't retry). Module-level so it survives re-mounts and track revisits.
const cache = new Map<string, string | null>();

/** Material 3 content-based source colour of a downscaled image copy (hex), or
 *  null if it can't be read (CORS-tainted). Celebi quantization → Score picks the
 *  best theme colour (favouring chroma + population, avoiding disliked/near-grey
 *  hues) — the same pipeline Material You uses for wallpaper theming. */
function extractSource(img: HTMLImageElement): string | null {
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
  return ranked.length ? hexFromArgb(ranked[0]) : null;
}

/**
 * The Material 3 content-based source colour of an image (hex) for toning UI from
 * artwork. Loads a CORS-anonymous copy through the loopback proxy and runs the M3
 * quantize→score pipeline; returns undefined until it resolves and whenever the
 * image can't be sampled (CORS-tainted / load error), so callers fall back to
 * another tone. Cached per URL.
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
          hex = extractSource(img);
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
