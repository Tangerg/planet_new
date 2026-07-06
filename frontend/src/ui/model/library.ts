import { collectionFlowItems, collectionSub, type FlowItem } from "./derive";
import type { ScreenData, VibeArtist, VibeCollection, VibeTrack } from "./vibe";

export type LibraryCardTab = "playlists" | "albums" | "artists";
export type LibraryCollectionRoute = "playlist" | "album" | "artist";

export const LIBRARY_SECTION_TABS = [
  { value: "playlists", label: "Playlists" },
  { value: "albums", label: "Albums" },
  { value: "artists", label: "Artists" },
  { value: "songs", label: "Songs" },
] satisfies { value: string; label: string }[];

export const LIBRARY_INITIAL_FLOW_CENTER = 2;

export type LibrarySongColumns = {
  split: number;
  left: VibeTrack[];
  right: VibeTrack[];
};

export type LibraryScreenModel = {
  tabs: typeof LIBRARY_SECTION_TABS;
  tracks: readonly VibeTrack[];
  collections: VibeCollection[];
  flowItems: FlowItem<VibeCollection>[];
  songColumns: LibrarySongColumns;
  cardTab: boolean;
  flowMode: boolean;
  round: boolean;
  collectionRoute: LibraryCollectionRoute;
};

export function isLibraryCardTab(tab: string): tab is LibraryCardTab {
  return tab === "playlists" || tab === "albums" || tab === "artists";
}

export function libraryCollectionRoute(tab: string): LibraryCollectionRoute {
  if (tab === "albums") return "album";
  if (tab === "artists") return "artist";
  return "playlist";
}

function artistAsCollection(artist: VibeArtist): VibeCollection {
  return { ...artist, kind: "Artist", tracks: [] };
}

export function libraryCollections(data: ScreenData, tab: string): VibeCollection[] {
  if (tab === "albums") return data.albums;
  if (tab === "artists") return data.artists.map(artistAsCollection);
  return data.playlists;
}

export function libraryTracksForCollection(
  tab: string,
  tracks: readonly VibeTrack[],
  collection: VibeCollection,
): VibeTrack[] {
  if (tab !== "artists") return collection.tracks ?? [];
  return tracks.filter((track) => track.artistId === collection.id);
}

export function librarySongColumns(tracks: readonly VibeTrack[]): LibrarySongColumns {
  const split = Math.ceil(tracks.length / 2);
  return {
    split,
    left: tracks.slice(0, split),
    right: tracks.slice(split),
  };
}

export function libraryScreenModel(
  data: ScreenData,
  tab: string,
  view: string,
): LibraryScreenModel {
  const cardTab = isLibraryCardTab(tab);
  const collections = cardTab ? libraryCollections(data, tab) : [];
  return {
    tabs: LIBRARY_SECTION_TABS,
    tracks: data.allTracks,
    collections,
    flowItems: collectionFlowItems(collections, (collection) => collectionSub(collection, tab)),
    songColumns: librarySongColumns(data.allTracks),
    cardTab,
    flowMode: cardTab && view === "flow",
    round: tab === "artists",
    collectionRoute: libraryCollectionRoute(tab),
  };
}
