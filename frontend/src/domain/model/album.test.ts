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

  test("reads the release year off the date at whatever precision the source knows", () => {
    // A calendar date is a day, so the answer cannot depend on the reader's zone:
    // "2024-01-01" through a Date reports 2023 anywhere west of UTC.
    expect(Album.year(album({ releaseDate: "2024-01-01" }))).toBe(2024);
    expect(Album.year(album({ releaseDate: "2009-11-02" }))).toBe(2009);
    expect(Album.year(album({ releaseDate: "1981-12" }))).toBe(1981);
    expect(Album.year(album({ releaseDate: "1981" }))).toBe(1981);
    expect(Album.year(album())).toBeUndefined();
    expect(Album.year(album({ releaseDate: "" }))).toBeUndefined();
    expect(Album.year(album({ releaseDate: "unknown" }))).toBeUndefined();
  });
});
