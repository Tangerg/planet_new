import { describe, expect, test } from "vitest";
import { Album, type AlbumSnapshot } from "./album";
import { ProviderId } from "./provider-id";

const TEST_PROVIDER_ID = ProviderId.of("test");

/** A whole album, since the companion takes whole albums. */
const album = (overrides: Partial<AlbumSnapshot> = {}): AlbumSnapshot => ({
  providerId: TEST_PROVIDER_ID,
  id: "album",
  name: "Album",
  images: [],
  artists: [],
  ...overrides,
});

describe("Album", () => {
  test("exposes named artist credits", () => {
    const value = album({
      artists: [
        { providerId: TEST_PROVIDER_ID, id: "empty", name: " " },
        { providerId: TEST_PROVIDER_ID, id: "artist-1", name: "Album Artist" },
      ],
    });

    expect(Album.primaryArtist(value)?.id).toBe("artist-1");
    expect(Album.artistNames(value)).toBe("Album Artist");
    expect(Album.artistCredits(value)).toEqual([{ id: "artist-1", name: "Album Artist" }]);
  });
});
