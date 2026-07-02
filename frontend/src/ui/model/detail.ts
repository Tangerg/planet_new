import type { ProviderCapability } from "@domain";
import type { Album } from "@domain/model/album";
import type { Artist } from "@domain/model/artist";
import type { MusicVideo } from "@domain/model/music-video";
import type { Playlist } from "@domain/model/playlist";

import {
  toVibeAlbum,
  toVibeArtist,
  toVibeMusicVideo,
  toVibePlaylist,
  toVibeTracks,
  type ArtistTarget,
  type DetailTarget,
  type OpenTarget,
  type VibeCollection,
  type VibeMusicVideo,
} from "@/model/adapt";

export type DetailKind = "Album" | "Chart" | "Playlist";

export type CollectionDetailReader = {
  albumDetail(id: string): Promise<Album>;
  playlistDetail(id: string): Promise<Playlist>;
  toplistDetail(id: string): Promise<Playlist>;
};

export type ArtistDetailReader = {
  artistDetail(id: string): Promise<Artist>;
};

export type MusicVideoDetailReader = {
  musicVideoDetail(id: string): Promise<MusicVideo | undefined>;
};

export function detailKindOf(target: Pick<OpenTarget, "kind">): DetailKind {
  if (target.kind === "Album") return "Album";
  if (target.kind === "Chart") return "Chart";
  return "Playlist";
}

export function normalizeDetailTarget(input: OpenTarget): DetailTarget {
  return { ...input, kind: detailKindOf(input), tracks: input.tracks ?? [] };
}

export function shouldFetchDetailTarget(target: DetailTarget): boolean {
  return Boolean(target.id && target.fetchDetail !== false && target.tracks.length === 0);
}

export async function loadDetailTarget(
  reader: CollectionDetailReader,
  target: DetailTarget,
): Promise<VibeCollection> {
  const kind = detailKindOf(target);
  if (kind === "Album") return toVibeAlbum(await reader.albumDetail(target.id));
  if (kind === "Chart") return toVibePlaylist(await reader.toplistDetail(target.id));
  return toVibePlaylist(await reader.playlistDetail(target.id));
}

export function mergeDetailTarget(summary: DetailTarget, full: VibeCollection): DetailTarget {
  return {
    ...summary,
    ...full,
    name: full.name || summary.name,
    image: full.image || summary.image,
    coverSeed: summary.coverSeed ?? full.coverSeed,
    kind: summary.kind ?? full.kind,
    tracks: full.tracks?.length ? full.tracks : summary.tracks,
  };
}

export function shouldFetchArtistTarget(target: ArtistTarget): boolean {
  return Boolean(target.id && (!target.tracks || target.tracks.length === 0));
}

export async function loadArtistTarget(
  reader: ArtistDetailReader,
  target: ArtistTarget,
): Promise<ArtistTarget> {
  const full = await reader.artistDetail(target.id);
  return {
    ...toVibeArtist(full),
    tracks: toVibeTracks(full.topTracks),
  };
}

export function shouldFetchMusicVideoDetail(
  target: VibeMusicVideo,
  supports: (capability: ProviderCapability) => boolean,
): boolean {
  return Boolean(target.id && supports("musicVideoDetail"));
}

export async function loadMusicVideoDetail(
  reader: MusicVideoDetailReader,
  target: VibeMusicVideo,
): Promise<VibeMusicVideo | undefined> {
  const full = await reader.musicVideoDetail(target.id);
  return full ? toVibeMusicVideo(full) : undefined;
}

export function mergeMusicVideoDetail(
  current: VibeMusicVideo | null,
  requestedId: string,
  detail: VibeMusicVideo | undefined,
): VibeMusicVideo | null {
  if (!current || current.id !== requestedId || !detail) return current;
  return { ...current, ...detail };
}
