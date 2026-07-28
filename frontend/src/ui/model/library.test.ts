import { describe, expect, it } from "vitest";

import type { ScreenData, VibeArtist, VibeCollection, VibeTrack } from "./vibe";
import {
  LIBRARY_INITIAL_FLOW_CENTER,
  libraryCollections,
  libraryScreenModel,
  librarySongColumns,
  libraryTracksForCollection,
} from "./library";

const track = (id: string, artistId?: string): VibeTrack => ({
  id,
  title: id,
  name: id,
  artist: "Artist",
  artistId,
  coverSeed: 1,
  durSec: 10,
  duration: "0:10",
});

const collection = (id: string, kind = "Playlist", tracks: VibeTrack[] = []): VibeCollection => ({
  id,
  name: id,
  kind,
  coverSeed: 1,
  tracks,
});

const artist = (id: string): VibeArtist => ({
  id,
  name: id,
  coverSeed: 2,
  image: `${id}.jpg`,
});

const screenData = (overrides: Partial<ScreenData> = {}): ScreenData => ({
  playlists: [collection("p1", "Playlist", [track("p-track")])],
  albums: [collection("al1", "Album", [track("al-track")])],
  artists: [artist("ar1"), artist("ar2")],
  allTracks: [track("t1", "ar1"), track("t2", "ar2"), track("t3", "ar1")],
  ...overrides,
});

describe("library screen model", () => {
  it("selects the active card collections by tab", () => {
    const data = screenData();

    expect(libraryCollections(data, "playlists").map((item) => item.id)).toEqual(["p1"]);
    expect(libraryCollections(data, "albums").map((item) => item.id)).toEqual(["al1"]);
  });

  it("projects artists into collection summaries for shared card/list/flow UI", () => {
    const [projected] = libraryCollections(screenData(), "artists");

    expect(projected).toMatchObject({
      id: "ar1",
      name: "ar1",
      kind: "Artist",
      image: "ar1.jpg",
      tracks: [],
    });
  });

  it("resolves collection tracks differently for artists and normal collections", () => {
    const data = screenData();
    const [playlist] = data.playlists;
    const [artistCollection] = libraryCollections(data, "artists");

    expect(
      libraryTracksForCollection("playlists", data.allTracks, playlist).map((t) => t.id),
    ).toEqual(["p-track"]);
    expect(
      libraryTracksForCollection("artists", data.allTracks, artistCollection).map((t) => t.id),
    ).toEqual(["t1", "t3"]);
  });

  it("splits songs into balanced display columns", () => {
    const columns = librarySongColumns([track("1"), track("2"), track("3")]);

    expect(columns.split).toBe(2);
    expect(columns.left.map((t) => t.id)).toEqual(["1", "2"]);
    expect(columns.right.map((t) => t.id)).toEqual(["3"]);
  });

  it("keeps the library flow initial center explicit", () => {
    expect(LIBRARY_INITIAL_FLOW_CENTER).toBe(2);
  });

  it("derives flow and routing flags for the active tab/view", () => {
    const artists = libraryScreenModel(screenData(), "artists", "flow");
    const songs = libraryScreenModel(screenData(), "songs", "list");

    expect(artists).toMatchObject({
      cardTab: true,
      flowMode: true,
      round: true,
      collectionRoute: "artist",
    });
    expect(artists.tabs.map((tab) => tab.label.key)).toEqual([
      "common.playlists",
      "common.albums",
      "common.artists",
      "common.songs",
    ]);
    expect(artists.tabs.map((tab) => tab.value)).toEqual([
      "playlists",
      "albums",
      "artists",
      "songs",
    ]);
    expect(artists.collections).toHaveLength(2);
    expect(songs).toMatchObject({
      cardTab: false,
      flowMode: false,
      round: false,
      collectionRoute: "playlist",
    });
    expect(songs.collections).toEqual([]);
  });
});
