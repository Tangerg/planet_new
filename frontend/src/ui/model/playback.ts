import { PlayQueue } from "@domain/model/play-queue";
import type { Track } from "@domain/model/track";

import { toTrack, toVibeTrack } from "@/model/adapters/track";
import type { VibeTrack } from "@/model/vibe";

/**
 * Playback-facing presentation projections. These functions keep queue/domain
 * semantics outside React hooks while returning the Vibe display shapes the
 * current UI renders.
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

export function playbackCommandQueue(
  list: readonly VibeTrack[] | null | undefined,
  track: VibeTrack,
): Track[] {
  return (list?.length ? list : [track]).map(toTrack);
}

export function playbackCommandTarget(track: VibeTrack): Track {
  return toTrack(track);
}

export function shufflePlaybackCommandQueue(list: readonly VibeTrack[]): Track[] {
  return list.map(toTrack);
}

export function queueCommandTrack(track: VibeTrack): Track {
  return toTrack(track);
}
