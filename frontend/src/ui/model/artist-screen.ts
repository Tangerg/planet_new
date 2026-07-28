import type { LocalizedText } from "@/i18n/text";

import { collectionFlowItems, collectionTrackCount, type FlowItem } from "./derive";
import {
  sameVibeTrack,
  type ArtistTarget,
  type VibeArtist,
  type VibeCollection,
  type VibeTrack,
} from "./vibe";

export const ARTIST_SECTION_TABS = [
  { value: "top", label: { key: "artist.hot" } },
  { value: "albums", label: { key: "artist.allAlbums" } },
  { value: "similar", label: { key: "artist.similarArtist" } },
] satisfies { value: string; label: LocalizedText }[];

export type ArtistScreenModel = {
  albumFlowItems: FlowItem<VibeCollection>[];
  firstTrack?: VibeTrack;
  hasPlayableTracks: boolean;
  playingArtistTrack: boolean;
  showViewToggle: boolean;
  statLabels: LocalizedText[];
  tabs: typeof ARTIST_SECTION_TABS;
  tracks: readonly VibeTrack[];
  albums: readonly VibeCollection[];
  similar: readonly VibeArtist[];
};

export function artistSectionShowsViewToggle(tab: string): boolean {
  return tab !== "similar";
}

/** The hero stat pills, in order. Zero albums / unknown listeners drop out
 *  rather than showing a "0" pill; genres are provider content, not messages. */
export function artistStatLabels(
  artist: Pick<ArtistTarget, "genres" | "listeners">,
  tracks: readonly VibeTrack[],
  albums: readonly VibeCollection[],
): LocalizedText[] {
  return [
    { key: "counts.tracks", values: { count: tracks.length } } as LocalizedText,
    ...(albums.length > 0
      ? [{ key: "counts.albums", values: { count: albums.length } } as LocalizedText]
      : []),
    ...(artist.listeners
      ? [{ key: "counts.listeners", values: { count: artist.listeners } } as LocalizedText]
      : []),
    ...(artist.genres ?? []).map((genre): LocalizedText => ({ text: genre })),
  ];
}

export function artistAlbumSubtitle(album: Pick<VibeCollection, "year">): string {
  return String(album.year ?? "");
}

/** Album row meta on the artist page: release year then track count. */
export function artistAlbumListMeta(album: VibeCollection): LocalizedText[] {
  return [
    { text: album.year ? String(album.year) : "" },
    { key: "counts.tracks", values: { count: collectionTrackCount(album) } },
  ];
}

export function artistAlbumFlowItems(albums: VibeCollection[]): FlowItem<VibeCollection>[] {
  return collectionFlowItems(albums, artistAlbumSubtitle);
}

export function isArtistTrackPlaying(
  tracks: readonly VibeTrack[],
  current: VibeTrack | undefined,
  playing: boolean,
): boolean {
  return playing && tracks.some((track) => sameVibeTrack(track, current));
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
