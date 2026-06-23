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
 * Pick one URL from images[]. Defaults to the largest (first); pass
 * prefer="small" for the last (smallest). Returns "" for an empty list.
 */
export function pickImageUrl(images?: Image[], prefer: "large" | "small" = "large"): string {
  if (!images || images.length === 0) return "";
  return prefer === "small" ? images[images.length - 1].url : images[0].url;
}
