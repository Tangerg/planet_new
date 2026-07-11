/** Clamp `value` into a valid array-index range [0, count-1]; 0 when the list is
 *  empty. The one canonical bounded-index clamp (carousels, launchers, lists). */
export function clampIndex(value: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(count - 1, value));
}

export function compactCount(n: number | undefined): string {
  const value = Math.max(0, n ?? 0);
  const short = (scaled: number): string => scaled.toFixed(1).replace(/\.0$/, "");
  if (value >= 1_000_000) return `${short(value / 1_000_000)}M`;
  if (value >= 1_000) return `${short(value / 1_000)}K`;
  return String(value);
}
