export type CoverParticles = {
  count: number;
  nx: Float32Array;
  ny: Float32Array;
  r: Float32Array;
  g: Float32Array;
  b: Float32Array;
  luma: Float32Array;
  seed: Float32Array;
};

function hashSeed(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function sampleCoverParticles(
  pixels: ArrayLike<number>,
  imageWidth: number,
  imageHeight: number,
  grid: number,
): CoverParticles {
  const cells = Math.max(1, Math.floor(grid));
  const max = cells * cells;
  const nx = new Float32Array(max);
  const ny = new Float32Array(max);
  const r = new Float32Array(max);
  const g = new Float32Array(max);
  const b = new Float32Array(max);
  const luma = new Float32Array(max);
  const seed = new Float32Array(max);

  const aspect = imageWidth / Math.max(1, imageHeight);
  const spanX = aspect >= 1 ? 0.5 : 0.5 * aspect;
  const spanY = aspect >= 1 ? 0.5 / aspect : 0.5;

  let count = 0;
  for (let gy = 0; gy < cells; gy++) {
    for (let gx = 0; gx < cells; gx++) {
      const sx = Math.min(imageWidth - 1, Math.floor(((gx + 0.5) / cells) * imageWidth));
      const sy = Math.min(imageHeight - 1, Math.floor(((gy + 0.5) / cells) * imageHeight));
      const p = (sy * imageWidth + sx) * 4;
      const alpha = pixels[p + 3] ?? 0;
      if (alpha < 8) continue;

      const cr = (pixels[p] ?? 0) / 255;
      const cg = (pixels[p + 1] ?? 0) / 255;
      const cb = (pixels[p + 2] ?? 0) / 255;
      const u = cells > 1 ? gx / (cells - 1) : 0.5;
      const v = cells > 1 ? gy / (cells - 1) : 0.5;
      nx[count] = (u - 0.5) * 2 * spanX;
      ny[count] = (v - 0.5) * 2 * spanY;
      r[count] = cr;
      g[count] = cg;
      b[count] = cb;
      luma[count] = 0.299 * cr + 0.587 * cg + 0.114 * cb;
      seed[count] = hashSeed(count + 1);
      count++;
    }
  }

  return {
    count,
    nx: nx.subarray(0, count),
    ny: ny.subarray(0, count),
    r: r.subarray(0, count),
    g: g.subarray(0, count),
    b: b.subarray(0, count),
    luma: luma.subarray(0, count),
    seed: seed.subarray(0, count),
  };
}
