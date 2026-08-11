// ============================================================
// App-level defaults & config — values that were previously hard-coded inline
// across Shell / screens, centralised so they're tuned in one place.
// ============================================================
import type { NowPlayingOpenMode } from "./now-playing";
import type { VibeTrack } from "./vibe";

/** Accent palette offered in Settings; the first is the boot default. */
export const ACCENT_OPTIONS = ["#0fff83", "#ff2188", "#19d3c5", "#ff5a3c", "#7a5cff"] as const;
export const DEFAULT_ACCENT: string = ACCENT_OPTIONS[0];

/** Shown in the player bar / screens before playback starts (defined fields, not
 *  undefined). The idle title is user-facing, so the caller passes it in
 *  translated rather than baking one language into a module constant. */
export function placeholderTrack(title: string): VibeTrack {
  return {
    id: "",
    title,
    name: title,
    artist: "",
    coverSeed: 0,
    durSec: 0,
    duration: "0:00",
  };
}

/** Seed chips on the Search screen (tap to fill the query). */
export const SEARCH_SUGGESTIONS = ["周杰伦", "陈奕迅", "薛之谦", "林俊杰", "邓紫棋", "毛不易"];

/** User preferences (persisted in UI state, not the kernel). */
export const AUDIO_QUALITIES = ["STD", "HQ", "SQ"] as const;
export type AudioQuality = (typeof AUDIO_QUALITIES)[number];

export type Settings = {
  quality: AudioQuality;
  npMode: NowPlayingOpenMode;
  crossfade: boolean;
  gapless: boolean;
  waves: boolean;
  reduceMotion: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  quality: "SQ",
  npMode: "cover",
  crossfade: true,
  gapless: false,
  waves: true,
  reduceMotion: false,
};
