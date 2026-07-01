import { describe, expect, test } from "vitest";
import { ArtistCredit } from "./artist-credit";

describe("ArtistCredit", () => {
  test("keeps named credits as small value objects", () => {
    expect(ArtistCredit.from([{ id: "1", name: "Faye Wong" }, { name: "Cocteau Twins" }])).toEqual([
      { id: "1", name: "Faye Wong" },
      { name: "Cocteau Twins" },
    ]);
  });

  test("falls back only when primary credits have no displayable names", () => {
    expect(
      ArtistCredit.from(
        [{ id: "empty", name: " " }],
        [{ id: "album-artist", name: "Album Artist" }],
      ),
    ).toEqual([{ id: "album-artist", name: "Album Artist" }]);
  });

  test("joins credit names for display", () => {
    expect(ArtistCredit.names(ArtistCredit.from([{ name: "A" }, { name: "B" }]))).toBe("A, B");
  });
});
