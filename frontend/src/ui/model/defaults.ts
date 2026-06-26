// ============================================================
// App-level defaults & config — values that were previously hard-coded inline
// across Shell / screens, centralised so they're tuned in one place.
// ============================================================
import type { VibeTrack } from "./adapt";

/** Accent palette offered in Settings; the first is the boot default. */
export const ACCENT_OPTIONS = ["#0fff83", "#ff2188", "#19d3c5", "#ff5a3c", "#7a5cff"] as const;
export const DEFAULT_ACCENT: string = ACCENT_OPTIONS[0];

/** Glass blur radius (px) applied to `--glass-blur`. */
export const DEFAULT_GLASS_BLUR = 30;

/** Shown in the player bar / screens before playback starts (defined fields, not undefined). */
export const PLACEHOLDER_TRACK: VibeTrack = {
  id: "",
  title: "Not playing",
  name: "Not playing",
  artist: "",
  coverSeed: 0,
  durSec: 0,
  duration: "0:00",
};

/** Seed chips on the Search screen (tap to fill the query). */
export const SEARCH_SUGGESTIONS = ["周杰伦", "陈奕迅", "薛之谦", "林俊杰", "邓紫棋", "毛不易"];

/** User preferences (persisted in UI state, not the kernel). */
export type Settings = {
  quality: string;
  npMode: string;
  crossfade: boolean;
  gapless: boolean;
  waves: boolean;
  comments: boolean;
  reduceMotion: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  quality: "SQ",
  npMode: "COVER",
  crossfade: true,
  gapless: false,
  waves: true,
  comments: true,
  reduceMotion: false,
};
