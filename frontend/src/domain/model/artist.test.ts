import { describe, expect, test } from "vitest";
import { Artist } from "./artist";

describe("Artist", () => {
  test("keeps unique provider lookup ids in encounter order", () => {
    expect(
      Artist.uniqueIds([{ id: "a" }, { id: " " }, {}, { id: "b" }, { id: "a" }, { id: "c" }], 2),
    ).toEqual(["a", "b"]);
  });
});
