import type { ProviderCapability } from "@domain";
import type { Album } from "@domain/model/album";
import { Artist } from "@domain/model/artist";
import type { MusicVideo } from "@domain/model/music-video";
import type { Playlist } from "@domain/model/playlist";

import { toVibeAlbum, toVibePlaylist } from "@/model/adapters/collection";
import { toVibeArtist } from "@/model/adapters/artist";
import { toVibeMusicVideo } from "@/model/adapters/music-video";
import { toVibeTracks } from "@/model/adapters/track";
import type {
  ArtistTarget,
  DetailTarget,
  OpenTarget,
  VibeCollection,
  VibeMusicVideo,
  VibeTrack,
} from "@/model/vibe";

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

export function weightedDisplayLength(value: string): number {
  return [...value].reduce((total, ch) => total + (/[⺀-鿿＀-￯]/.test(ch) ? 2 : 1), 0);
}

export function detailHeroTitleSize(name: string | undefined): number {
  const weight = weightedDisplayLength(name ?? "");
  if (weight > 48) return 34;
  if (weight > 36) return 42;
  if (weight > 24) return 52;
  return 64;
}

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

export function detailSelectionOrderIds(sorted: readonly { t: Pick<VibeTrack, "id"> }[]): string[] {
  return sorted.map((row) => row.t.id);
}

export function nextDetailSelection({
  anchorId,
  extendRange,
  orderedIds,
  selected,
  trackId,
}: {
  anchorId: string | null;
  extendRange: boolean;
  orderedIds: readonly string[];
  selected: ReadonlySet<string>;
  trackId: string;
}): Set<string> {
  const next = new Set(selected);
  if (extendRange && anchorId != null) {
    const a = orderedIds.indexOf(anchorId);
    const b = orderedIds.indexOf(trackId);
    if (a > -1 && b > -1) {
      const [lo, hi] = a < b ? [a, b] : [b, a];
      for (let k = lo; k <= hi; k++) next.add(orderedIds[k]);
      return next;
    }
  }

  if (next.has(trackId)) next.delete(trackId);
  else next.add(trackId);
  return next;
}

export function detailSelectedTracks<T extends Pick<VibeTrack, "id">>(
  tracks: readonly T[],
  selected: ReadonlySet<string>,
): T[] {
  return tracks.filter((track) => selected.has(track.id));
}

export function firstDetailSelectedTrack<T extends Pick<VibeTrack, "id">>(
  tracks: readonly T[],
  selected: ReadonlySet<string>,
): T | undefined {
  return tracks.find((track) => selected.has(track.id));
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
    tracks: toVibeTracks(Artist.hotTracks(full)),
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
