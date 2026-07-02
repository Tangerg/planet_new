import type { Lyric } from "@domain/model/lyric";

const NO_LYRICS: Lyric = { content: "No lyrics for this track.", duration: 0 };

/** The lyric lines to render, or a single "no lyrics" line when there are none. */
export function lyricLinesOrFallback(lines: readonly Lyric[]): Lyric[] {
  return lines.length ? [...lines] : [NO_LYRICS];
}

/** The axis a Now Playing swipe resolves to (null = below the drag threshold). */
export type SwipeAxis = "next" | "prev" | "up" | "down" | null;

/**
 * Map a swipe delta to a navigation axis. A strictly-dominant horizontal swipe
 * skips tracks (left = next, right = prev); otherwise it's vertical — up opens
 * lyrics, down opens the queue (exact-magnitude ties fall to vertical/down). The
 * screen decides what "up" means against the current queue state — this is only
 * the direction, kept pure so the gesture math is testable on its own.
 */
export function swipeAction(dx: number, dy: number, threshold = 40): SwipeAxis {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (Math.max(ax, ay) < threshold) return null;
  if (ax > ay) return dx < 0 ? "next" : "prev";
  return dy < 0 ? "up" : "down";
}
