import type { Lyric } from "@contexts/playback";

import type { LocalizedText } from "@/i18n/text";

import type { VibeTrack } from "./vibe";

export type NowPlayingMode = "cover" | "lyrics" | "comments";

export type NowPlayingTrackModel = {
  artist: string;
  artistId?: string;
  artists?: VibeTrack["artists"];
  coverSeed: number;
  credits: LocalizedText[];
  gradient?: string[];
  image?: string;
  images?: VibeTrack["images"];
  quality?: string;
  title: string;
};

export function normalizeNowPlayingMode(mode: string | undefined): NowPlayingMode {
  if (mode === "lyrics" || mode === "comments") return mode;
  return "cover";
}

export function isNowPlayingLyricsMode(mode: NowPlayingMode): boolean {
  return mode === "lyrics";
}

export function isNowPlayingCommentsMode(mode: NowPlayingMode): boolean {
  return mode === "comments";
}

export function isNowPlayingPanelOpen(mode: NowPlayingMode): boolean {
  return mode !== "cover";
}

export function toggleNowPlayingLyricsMode(mode: NowPlayingMode): NowPlayingMode {
  return mode === "lyrics" ? "cover" : "lyrics";
}

/** Writing/production credits, in display order; empty when the provider gave none. */
export function nowPlayingCredits(credits: VibeTrack["credits"] | undefined): LocalizedText[] {
  return [
    ...(credits?.music
      ? [{ key: "player.writtenBy", values: { name: credits.music } } as const]
      : []),
    ...(credits?.producer
      ? [{ key: "player.producedBy", values: { name: credits.producer } } as const]
      : []),
  ];
}

export function nowPlayingTrackModel(track: VibeTrack | undefined): NowPlayingTrackModel {
  return {
    artist: track?.artist ?? "",
    artistId: track?.artistId,
    artists: track?.artists,
    coverSeed: track?.coverSeed ?? 0,
    credits: nowPlayingCredits(track?.credits),
    gradient: track?.gradient,
    image: track?.image,
    images: track?.images,
    quality: track?.quality,
    title: track?.title ?? "",
  };
}

/** The lyric lines to render, or a single "no lyrics" line when there are none.
 *  The fallback text is required: there is no English default to fall back to. */
export function lyricLinesOrFallback(lines: readonly Lyric[], fallback: string): Lyric[] {
  return lines.length ? [...lines] : [{ content: fallback, duration: 0 }];
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
