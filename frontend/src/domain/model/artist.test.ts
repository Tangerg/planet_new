import { describe, expect, test } from "vitest";
import { Artist, type ArtistSnapshot } from "./artist";
import { ProviderId } from "./provider-id";

const TEST_PROVIDER_ID = ProviderId.of("test");

/** A whole artist, since the companion takes whole artists. */
const artist = (overrides: Partial<ArtistSnapshot> = {}): ArtistSnapshot => ({
  providerId: TEST_PROVIDER_ID,
  id: "artist",
  name: "Artist",
  images: [],
  ...overrides,
});

describe("Artist", () => {
  test("keeps unique provider lookup ids in encounter order", () => {
    expect(
      Artist.uniqueIds(
        [{ id: "a" }, { id: " " }, { id: "" }, { id: "b" }, { id: "a" }, { id: "c" }],
        2,
      ),
    ).toEqual(["a", "b"]);
  });

  test("exposes hot tracks as a never-undefined list", () => {
    expect(Artist.hotTracks(artist())).toEqual([]);
    const top = [
      { providerId: TEST_PROVIDER_ID, id: "t1", name: "Song", durationMs: 1, artists: [] },
    ];
    expect(Artist.hotTracks(artist({ topTracks: top }))).toBe(top);
  });
});
