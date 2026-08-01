import { describe, expectTypeOf, it } from "vitest";
import type { LibraryService, UserLibrary } from ".";

describe("Account Library public API", () => {
  it("exposes saved-library browsing without engagement relationships", () => {
    expectTypeOf<LibraryService>().toHaveProperty("userPlaylists");
    expectTypeOf<Awaited<ReturnType<LibraryService["userPlaylists"]>>>().toHaveProperty("status");
    expectTypeOf<UserLibrary>().not.toHaveProperty("likedTrackIds");
    expectTypeOf<UserLibrary>().not.toHaveProperty("playRecord");
  });
});
