import { Track, type TrackSnapshot } from "@contexts/catalog";

import { seedOf, type VibeTrack } from "@/model/vibe";
import { toArtistRefs } from "@/model/adapters/helpers";

export function toVibeTrack(real: TrackSnapshot, i?: number): VibeTrack {
  const credited = Track.artistCredits(real);
  return {
    providerId: real.providerId,
    id: String(real.id ?? ""),
    index: real.index ?? i,
    title: real.name ?? "",
    name: real.name ?? "",
    artist: Track.artistNames(real),
    artistId: Track.primaryArtist(real)?.id,
    artists: toArtistRefs(credited),
    album: real.album?.name,
    albumId: real.album?.id,
    image: Track.coverUrl(real),
    images: real.album?.images,
    coverSeed: seedOf(real.id),
    gradient: undefined,
    durSec: Track.durationSeconds(real),
    duration: Track.durationFormatted(real),
    playUrl: real.playUrl,
    playbackId: real.playbackId,
    musicVideoId: real.musicVideoId,
    requiresSubscription: real.requiresSubscription,
    source: real,
  };
}

export const toVibeTracks = (tracks?: readonly TrackSnapshot[]) =>
  (tracks ?? []).map((track, i) => toVibeTrack(track, i));

/**
 * Recover the domain Track from a VibeTrack, for handing playback back to the
 * kernel. Uses the projected `source` when available. A view-only track may be
 * converted only when it carries an explicit provider namespace; placeholders
 * must remain presentation objects and never become fake domain entities.
 */
export function toTrack(vt: VibeTrack): TrackSnapshot {
  if (vt.source) return vt.source;
  if (!vt.providerId || !vt.id) {
    throw new Error("Cannot convert a source-less track without provider identity");
  }
  return {
    providerId: vt.providerId,
    id: vt.id,
    name: vt.name,
    durationMs: vt.durSec * 1000,
    trackNumber: 0,
    discNumber: 1,
    explicit: false,
    artists: vt.artist
      ? [{ providerId: vt.providerId, id: vt.artistId || vt.artist, name: vt.artist }]
      : [],
    album: vt.albumId
      ? { providerId: vt.providerId, id: vt.albumId, name: vt.album || "" }
      : undefined,
    playUrl: vt.playUrl,
    playbackId: vt.playbackId,
    musicVideoId: vt.musicVideoId,
  };
}
