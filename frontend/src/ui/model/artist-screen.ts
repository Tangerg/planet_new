import {
  collectionFlowItems,
  collectionTrackCount,
  collectionTrackCountLabel,
  type FlowItem,
} from "./derive";
import type { ArtistTarget, VibeArtist, VibeCollection, VibeTrack } from "./vibe";

export const ARTIST_SECTION_TABS = [
  { value: "top", label: "Hot" },
  { value: "albums", label: "All Albums" },
  { value: "similar", label: "Similar Artist" },
] satisfies { value: string; label: string }[];

export type ArtistScreenModel = {
  albumFlowItems: FlowItem<VibeCollection>[];
  firstTrack?: VibeTrack;
  hasPlayableTracks: boolean;
  playingArtistTrack: boolean;
  showViewToggle: boolean;
  statLabels: string[];
  tabs: typeof ARTIST_SECTION_TABS;
  tracks: readonly VibeTrack[];
  albums: readonly VibeCollection[];
  similar: readonly VibeArtist[];
};

export function artistSectionShowsViewToggle(tab: string): boolean {
  return tab !== "similar";
}

export function artistTrackCountLabel(count: number): string {
  return `${count} ${count === 1 ? "Track" : "Tracks"}`;
}

export function artistAlbumCountLabel(count: number): string | undefined {
  if (count <= 0) return undefined;
  return `${count} ${count === 1 ? "Album" : "Albums"}`;
}

export function artistListenerLabel(artist: Pick<ArtistTarget, "listeners">): string | undefined {
  return artist.listeners ? `${artist.listeners} Listeners` : undefined;
}

export function artistStatLabels(
  artist: Pick<ArtistTarget, "genres" | "listeners">,
  tracks: readonly VibeTrack[],
  albums: readonly VibeCollection[],
): string[] {
  return [
    artistTrackCountLabel(tracks.length),
    artistAlbumCountLabel(albums.length),
    artistListenerLabel(artist),
    ...(artist.genres ?? []),
  ].filter((label): label is string => Boolean(label));
}

export function artistAlbumSubtitle(album: Pick<VibeCollection, "year">): string {
  return String(album.year ?? "");
}

export function artistAlbumTrackCount(
  album: Pick<VibeCollection, "trackCount" | "tracks">,
): number {
  return collectionTrackCount(album);
}

export function artistAlbumListMeta(album: VibeCollection): string {
  return [album.year, collectionTrackCountLabel(album)].filter(Boolean).join(" · ");
}

export function artistAlbumFlowItems(albums: VibeCollection[]): FlowItem<VibeCollection>[] {
  return collectionFlowItems(albums, artistAlbumSubtitle);
}

export function isArtistTrackPlaying(
  tracks: readonly VibeTrack[],
  current: VibeTrack | undefined,
  playing: boolean,
): boolean {
  return playing && tracks.some((track) => track.id === current?.id);
}

export function artistScreenModel({
  artist,
  tracks,
  albums,
  similar,
  tab,
  current,
  playing,
}: {
  artist: ArtistTarget;
  tracks: VibeTrack[];
  albums: VibeCollection[];
  similar: VibeArtist[];
  tab: string;
  current?: VibeTrack;
  playing: boolean;
}): ArtistScreenModel {
  return {
    albumFlowItems: artistAlbumFlowItems(albums),
    firstTrack: tracks[0],
    hasPlayableTracks: tracks.length > 0,
    playingArtistTrack: isArtistTrackPlaying(tracks, current, playing),
    showViewToggle: artistSectionShowsViewToggle(tab),
    statLabels: artistStatLabels(artist, tracks, albums),
    tabs: ARTIST_SECTION_TABS,
    tracks,
    albums,
    similar,
  };
}
