import type { LocalizedText } from "@/i18n/text";

import type {
  CollectionViewMode,
  LibrarySectionTab,
  ScreenData,
  VibeArtist,
  VibeCollection,
  VibeTrack,
} from "./vibe";

/** The tabs backed by collection cards; `songs` renders a flat track list. */
export type LibraryCardTab = Exclude<LibrarySectionTab, "songs">;
export type LibraryCollectionRoute = "playlist" | "album" | "artist";

export const LIBRARY_SECTION_TABS = [
  { value: "playlists", label: { key: "common.playlists" } },
  { value: "albums", label: { key: "common.albums" } },
  { value: "artists", label: { key: "common.artists" } },
  { value: "songs", label: { key: "common.songs" } },
] satisfies { value: LibrarySectionTab; label: LocalizedText }[];

export const LIBRARY_INITIAL_FLOW_CENTER = 2;

/** One column of the two-up songs list. `startIndex` is the running position of
 *  its first track in the WHOLE list, so the right column continues the left's
 *  numbering instead of restarting at 1. */
export type LibrarySongColumn = {
  tracks: VibeTrack[];
  startIndex: number;
};

export type LibraryScreenModel = {
  tabs: typeof LIBRARY_SECTION_TABS;
  tracks: readonly VibeTrack[];
  collections: VibeCollection[];
  songColumns: readonly LibrarySongColumn[];
  cardTab: boolean;
  flowMode: boolean;
  round: boolean;
  collectionRoute: LibraryCollectionRoute;
};

export function isLibraryCardTab(tab: LibrarySectionTab): tab is LibraryCardTab {
  return tab === "playlists" || tab === "albums" || tab === "artists";
}

export function libraryCollectionRoute(tab: LibrarySectionTab): LibraryCollectionRoute {
  if (tab === "albums") return "album";
  if (tab === "artists") return "artist";
  return "playlist";
}

function artistAsCollection(artist: VibeArtist): VibeCollection {
  return { ...artist, kind: "artist", tracks: [] };
}

export function libraryCollections(data: ScreenData, tab: LibrarySectionTab): VibeCollection[] {
  if (tab === "albums") return data.albums;
  if (tab === "artists") return data.artists.map(artistAsCollection);
  return data.playlists;
}

export function libraryTracksForCollection(
  tab: LibrarySectionTab,
  tracks: readonly VibeTrack[],
  collection: VibeCollection,
): VibeTrack[] {
  if (tab !== "artists") return collection.tracks ?? [];
  return tracks.filter((track) => track.artistId === collection.id);
}

export function librarySongColumns(tracks: readonly VibeTrack[]): readonly LibrarySongColumn[] {
  const split = Math.ceil(tracks.length / 2);
  return [
    { tracks: tracks.slice(0, split), startIndex: 0 },
    { tracks: tracks.slice(split), startIndex: split },
  ];
}

export function libraryScreenModel(
  data: ScreenData,
  tab: LibrarySectionTab,
  view: CollectionViewMode,
): LibraryScreenModel {
  const cardTab = isLibraryCardTab(tab);
  const collections = cardTab ? libraryCollections(data, tab) : [];
  return {
    tabs: LIBRARY_SECTION_TABS,
    tracks: data.allTracks,
    collections,
    songColumns: librarySongColumns(data.allTracks),
    cardTab,
    flowMode: cardTab && view === "flow",
    round: tab === "artists",
    collectionRoute: libraryCollectionRoute(tab),
  };
}
