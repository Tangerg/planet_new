import { Track } from "@contexts/catalog";
import type { PlaybackAvailabilityPolicy } from "@contexts/playback";

import { sameVibeTrack, type VibeTrack } from "./vibe";

/**
 * What the row shows in its leading slot. Pointer hover is deliberately NOT an
 * input here: "a numbered playable row offers play under the cursor" is a
 * presentation rule, so the row renders both glyphs and CSS swaps them. Feeding
 * hover into the model made every mouse enter/leave a React render of a list
 * leaf — the model's job is to project track FACTS, not cursor position.
 */
export type TrackRowLeading =
  | { kind: "rank"; value: number; active: boolean }
  | { kind: "equalizer" }
  | { kind: "index"; value: number };

export type TrackRowBadge =
  | { kind: "version"; label: string }
  | { kind: "subscription"; label: "VIP" }
  | { kind: "unavailable"; label: "Unavailable" };

export type TrackRowModel = {
  current: boolean;
  unavailable: boolean;
  chart: boolean;
  leading: TrackRowLeading;
  badges: TrackRowBadge[];
};

export function trackRowModel({
  track,
  current,
  playing,
  index,
  rank,
  policy,
}: {
  track: VibeTrack;
  current?: VibeTrack;
  playing: boolean;
  index: number;
  rank?: number;
  policy?: PlaybackAvailabilityPolicy;
}): TrackRowModel {
  const isCurrent = sameVibeTrack(current, track);
  const unavailable = track.source ? Track.isUnavailable(track.source, policy) : false;
  const chart = rank != null;

  return {
    current: isCurrent,
    unavailable,
    chart,
    leading: trackRowLeading({ chart, current: isCurrent, playing, index, rank }),
    badges: trackRowBadges(track, unavailable),
  };
}

function trackRowLeading({
  chart,
  current,
  playing,
  index,
  rank,
}: {
  chart: boolean;
  current: boolean;
  playing: boolean;
  index: number;
  rank?: number;
}): TrackRowLeading {
  if (chart) return { kind: "rank", value: rank ?? index, active: current };
  if (current && playing) return { kind: "equalizer" };
  return { kind: "index", value: index };
}

function trackRowBadges(track: VibeTrack, unavailable: boolean): TrackRowBadge[] {
  const badges: TrackRowBadge[] = [];
  if (track.version && track.version !== "studio") {
    badges.push({ kind: "version", label: track.version });
  }
  if (track.requiresSubscription) {
    badges.push({ kind: "subscription", label: "VIP" });
  }
  if (unavailable) {
    badges.push({ kind: "unavailable", label: "Unavailable" });
  }
  return badges;
}
