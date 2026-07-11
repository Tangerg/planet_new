import { describe, expect, it } from "vitest";

import type { ArtistTarget, VibeArtist, VibeCollection, VibeTrack } from "./vibe";
import {
  artistAlbumListMeta,
  artistAlbumSubtitle,
  artistAlbumTrackCount,
  artistScreenModel,
  artistSectionShowsViewToggle,
  artistStatLabels,
  isArtistTrackPlaying,
} from "./artist-screen";
import { ProviderId } from "@domain/model/provider-id";

const TEST_PROVIDER_ID = ProviderId.of("test");
const OTHER_PROVIDER_ID = ProviderId.of("other");

const track = (id: string, providerId = TEST_PROVIDER_ID): VibeTrack => ({
  providerId,
  id,
  title: id,
  name: id,
  artist: "Artist",
  coverSeed: 1,
  durSec: 10,
  duration: "0:10",
});

const album = (id: string, overrides: Partial<VibeCollection> = {}): VibeCollection => ({
  id,
  name: id,
  kind: "Album",
  coverSeed: 2,
  tracks: [],
  ...overrides,
});

const artist = (overrides: Partial<ArtistTarget> = {}): ArtistTarget => ({
  id: "artist",
  name: "Artist",
  coverSeed: 3,
  ...overrides,
});

describe("artist screen model", () => {
  it("shows view controls for content tabs that support multiple views", () => {
    expect(artistSectionShowsViewToggle("top")).toBe(true);
    expect(artistSectionShowsViewToggle("albums")).toBe(true);
    expect(artistSectionShowsViewToggle("similar")).toBe(false);
  });

  it("derives stat labels while hiding absent album/listener facts", () => {
    expect(artistStatLabels(artist(), [track("t1")], [])).toEqual(["1 Track"]);
    expect(
      artistStatLabels(
        artist({ listeners: 1200, genres: ["Mandopop"] }),
        [track("t1"), track("t2")],
        [album("a1")],
      ),
    ).toEqual(["2 Tracks", "1 Album", "1200 Listeners", "Mandopop"]);
  });

  it("formats album subtitles and list meta without leaking undefined years", () => {
    expect(artistAlbumSubtitle(album("a1", { year: 2024 }))).toBe("2024");
    expect(artistAlbumSubtitle(album("a2"))).toBe("");
    expect(artistAlbumTrackCount(album("a3", { trackCount: 12 }))).toBe(12);
    expect(artistAlbumListMeta(album("a4", { year: 2021, tracks: [track("t1")] }))).toBe(
      "2021 · 1 track",
    );
    expect(artistAlbumListMeta(album("a5"))).toBe("0 tracks");
  });

  it("recognizes whether the current playing track belongs to the artist", () => {
    const tracks = [track("a"), track("b")];

    expect(isArtistTrackPlaying(tracks, track("b"), true)).toBe(true);
    expect(isArtistTrackPlaying(tracks, track("x"), true)).toBe(false);
    expect(isArtistTrackPlaying(tracks, track("b"), false)).toBe(false);
    expect(isArtistTrackPlaying(tracks, track("b", OTHER_PROVIDER_ID), true)).toBe(false);
  });

  it("collects the model consumed by the Artist screen", () => {
    const tracks = [track("t1")];
    const albums = [album("a1", { year: 2020 })];
    const similar: VibeArtist[] = [{ id: "s1", name: "Similar", coverSeed: 4 }];

    const model = artistScreenModel({
      artist: artist({ genres: ["Pop"] }),
      tracks,
      albums,
      similar,
      tab: "top",
      current: tracks[0],
      playing: true,
    });

    expect(model).toMatchObject({
      firstTrack: { id: "t1" },
      hasPlayableTracks: true,
      playingArtistTrack: true,
      showViewToggle: true,
      statLabels: ["1 Track", "1 Album", "Pop"],
      tracks,
      albums,
      similar,
    });
    expect(model.albumFlowItems[0]).toMatchObject({ id: "a1", sub: "2020" });
    expect(model.tabs.map((tab) => tab.value)).toEqual(["top", "albums", "similar"]);
  });
});
