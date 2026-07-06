import { describe, expect, it } from "vitest";

import { artistCreditLine } from "./artist-credit";

describe("artist credit model", () => {
  it("keeps only named credited artists", () => {
    expect(
      artistCreditLine({
        artists: [
          { id: "empty", name: "" },
          { id: "a", name: "A" },
          { id: "b", name: "B" },
        ],
        fallback: "Fallback",
        fallbackId: "fallback",
      }),
    ).toEqual({
      kind: "credited-artists",
      artists: [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
      ],
    });
  });

  it("uses the fallback artist when provider credits are missing", () => {
    expect(artistCreditLine({ fallback: "Fallback", fallbackId: "fallback" })).toEqual({
      kind: "fallback-artist",
      name: "Fallback",
      artistId: "fallback",
    });
  });

  it("preserves an empty fallback line for placeholder tracks", () => {
    expect(artistCreditLine({ artists: [{ id: "empty", name: "" }] })).toEqual({
      kind: "fallback-artist",
      name: undefined,
      artistId: undefined,
    });
  });
});
