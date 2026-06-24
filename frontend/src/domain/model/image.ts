/**
 * Cover / avatar image, aligned with the Spotify Image object: size variants of
 * the same asset. Ordered largest-first (images[0] is biggest), like Spotify.
 */
export type Image = {
  url: string;
  width?: number;
  height?: number;
};

/**
 * Pick one URL from images[] (ordered largest-first). `prefer` is either:
 *   - "large" (default) / "small": the first / last variant, or
 *   - a target width in device pixels: the smallest variant still ≥ target
 *     (so a 44px thumbnail fetches a small image and a 248px hero a large one);
 *     falls back to the largest when none qualify or widths are unknown.
 * Returns "" for an empty list.
 */
export function pickImageUrl(
  images?: Image[],
  prefer: "large" | "small" | number = "large",
): string {
  if (!images || images.length === 0) return "";
  if (typeof prefer === "number") {
    let chosen = images[0]; // largest fallback (also covers width-less variants)
    for (const img of images) {
      if ((img.width ?? 0) >= prefer) chosen = img; // shrink while still big enough
    }
    return chosen.url;
  }
  return prefer === "small" ? images[images.length - 1].url : images[0].url;
}
