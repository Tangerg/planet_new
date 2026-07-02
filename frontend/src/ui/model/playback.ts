import { PlayQueue } from "@domain/model/play-queue";
import type { Track } from "@domain/model/track";

import { toVibeTrack } from "@/model/adapters/track";
import type { VibeTrack } from "@/model/vibe";

/**
 * Playback-facing presentation projections. These functions keep queue/domain
 * semantics outside React hooks while still returning the legacy vibe shapes
 * the current UI renders.
 */
export function currentTrackView(track: Track | undefined): VibeTrack | undefined {
  return track ? toVibeTrack(track) : undefined;
}

export function playbackQueueView(tracks: readonly Track[] | undefined): VibeTrack[] {
  return (tracks ?? []).map((track) => toVibeTrack(track));
}

export function upNextView(
  tracks: readonly Track[] | undefined,
  current: Track | undefined,
): VibeTrack[] {
  return PlayQueue.upNext(tracks ?? [], current).map((track) => toVibeTrack(track));
}
