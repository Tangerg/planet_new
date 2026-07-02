import { Track } from "@domain/model/track";
import type { Track as DomainTrack } from "@domain/model/track";

import { seedOf, type VibeTrack } from "@/model/vibe";
import { toArtistRefs } from "@/model/adapters/helpers";

export function toVibeTrack(real: Partial<DomainTrack>, i?: number): VibeTrack {
  const credited = Track.artistCredits(real);
  return {
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
    musicVideoId: real.musicVideoId,
    available: true,
    source: real,
  };
}

export const toVibeTracks = (tracks?: Partial<DomainTrack>[]) =>
  (tracks ?? []).map((track, i) => toVibeTrack(track, i));

/**
 * Recover the domain Track from a VibeTrack, for handing playback back to the
 * kernel. Uses the projected `source` when available; otherwise synthesises a
 * minimal Track from the view fields (e.g. the hand-built placeholder track).
 */
export function toTrack(vt: VibeTrack): DomainTrack {
  if (vt.source && vt.source.id) return vt.source as DomainTrack;
  return {
    id: vt.id,
    name: vt.name,
    durationMs: vt.durSec * 1000,
    trackNumber: 0,
    discNumber: 1,
    explicit: false,
    artists: vt.artist ? [{ id: vt.artistId || vt.artist, name: vt.artist }] : [],
    album: vt.albumId ? { id: vt.albumId, name: vt.album || "" } : undefined,
    playUrl: vt.playUrl,
    musicVideoId: vt.musicVideoId,
  };
}
