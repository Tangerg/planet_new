import { useEffect, useState } from "react";

import { loopbackProxyUrl } from "@/infra/mediaSource";
import { sampleCoverParticles, type CoverParticles } from "@/model/stage-particles";

// Grid resolution: GRID² cells (minus transparent) become particles. Tuned for a
// cover-like cloud that still holds 60fps on the 2D canvas renderer.
const GRID = 80;
// Read the cover at this size — enough detail for GRID sampling, cheap to decode.
const SAMPLE_SIZE = 128;

// Sampled particles per URL (null = couldn't read, e.g. CORS-tainted — don't retry).
// Module-level so it survives re-mounts and track revisits.
const cache = new Map<string, CoverParticles | null>();

function sample(img: HTMLImageElement): CoverParticles | null {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE); // throws if CORS-tainted
  return sampleCoverParticles(data, SAMPLE_SIZE, SAMPLE_SIZE, GRID);
}

/**
 * Load a cover through the loopback proxy (CORS-clean, same as useCoverColors) and
 * sample it into a particle cloud for the fullscreen stage. Returns undefined until
 * it resolves or whenever it can't be read, so the renderer falls back to a
 * generated cloud. Cached per URL.
 */
export function useCoverParticles(url: string | undefined): CoverParticles | undefined {
  const [particles, setParticles] = useState<CoverParticles | undefined>(() =>
    url ? (cache.get(url) ?? undefined) : undefined,
  );

  useEffect(() => {
    if (!url) {
      setParticles(undefined);
      return;
    }
    const cached = cache.get(url);
    if (cached !== undefined) {
      setParticles(cached ?? undefined);
      return;
    }
    let cancelled = false;
    void loopbackProxyUrl(url).then((proxied) => {
      if (cancelled) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let result: CoverParticles | null = null;
        try {
          result = sample(img);
        } catch {
          result = null;
        }
        cache.set(url, result);
        if (!cancelled) setParticles(result ?? undefined);
      };
      img.onerror = () => {
        cache.set(url, null);
        if (!cancelled) setParticles(undefined);
      };
      img.src = proxied;
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return particles;
}
