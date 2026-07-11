import { describe, expect, test } from "vitest";
import { Album } from "./album";
import { ProviderId } from "./provider-id";

const TEST_PROVIDER_ID = ProviderId.of("test");

describe("Album", () => {
  test("exposes named artist credits", () => {
    const album = {
      artists: [
        { providerId: TEST_PROVIDER_ID, id: "empty", name: " " },
        { providerId: TEST_PROVIDER_ID, id: "artist-1", name: "Album Artist" },
      ],
    };

    expect(Album.primaryArtist(album)?.id).toBe("artist-1");
    expect(Album.artistNames(album)).toBe("Album Artist");
    expect(Album.artistCredits(album)).toEqual([{ id: "artist-1", name: "Album Artist" }]);
  });
});
