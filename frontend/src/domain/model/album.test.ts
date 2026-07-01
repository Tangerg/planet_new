import { describe, expect, test } from "vitest";
import { Album } from "./album";

describe("Album", () => {
  test("exposes named artist credits", () => {
    const album = {
      artists: [
        { id: "empty", name: " " },
        { id: "artist-1", name: "Album Artist" },
      ],
    };

    expect(Album.primaryArtist(album)?.id).toBe("artist-1");
    expect(Album.artistNames(album)).toBe("Album Artist");
    expect(Album.artistCredits(album)).toEqual([{ id: "artist-1", name: "Album Artist" }]);
  });
});
