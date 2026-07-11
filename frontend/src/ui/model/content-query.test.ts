import { describe, expect, it } from "vitest";

import {
  artistMusicVideoDiscoveryQueryEnabled,
  artistMusicVideosQueryEnabled,
  musicVideoCommentsQueryEnabled,
  supportedContentQueryEnabled,
  trackCommentsQueryEnabled,
  userLibraryQueryEnabled,
} from "./content-query";

describe("content query model", () => {
  it("enables account-scoped library reads only for logged-in supported providers", () => {
    expect(userLibraryQueryEnabled(true, true)).toBe(true);
    expect(userLibraryQueryEnabled(true, false)).toBe(false);
    expect(userLibraryQueryEnabled(false, true)).toBe(false);
  });

  it("combines request intent, target presence, and port availability", () => {
    expect(
      supportedContentQueryEnabled({
        requested: true,
        hasTarget: true,
        supported: true,
      }),
    ).toBe(true);
    expect(
      supportedContentQueryEnabled({
        requested: false,
        hasTarget: true,
        supported: true,
      }),
    ).toBe(false);
    expect(
      supportedContentQueryEnabled({
        requested: true,
        hasTarget: false,
        supported: true,
      }),
    ).toBe(false);
    expect(
      supportedContentQueryEnabled({
        supported: false,
      }),
    ).toBe(false);
  });

  it("plans artist music-video discovery from artist ids and port availability", () => {
    expect(artistMusicVideoDiscoveryQueryEnabled(["a"], true)).toBe(true);
    expect(artistMusicVideoDiscoveryQueryEnabled([], true)).toBe(false);
    expect(artistMusicVideoDiscoveryQueryEnabled(["a"], false)).toBe(false);
  });

  it("plans identified content queries only when requested and addressable", () => {
    expect(artistMusicVideosQueryEnabled("artist", true, true)).toBe(true);
    expect(artistMusicVideosQueryEnabled(undefined, true, true)).toBe(false);
    expect(artistMusicVideosQueryEnabled("artist", false, true)).toBe(false);

    expect(musicVideoCommentsQueryEnabled("mv", true, true)).toBe(true);
    expect(musicVideoCommentsQueryEnabled(undefined, true, true)).toBe(false);
    expect(musicVideoCommentsQueryEnabled("mv", true, false)).toBe(false);

    expect(trackCommentsQueryEnabled("track", true, true)).toBe(true);
    expect(trackCommentsQueryEnabled(undefined, true, true)).toBe(false);
    expect(trackCommentsQueryEnabled("track", false, true)).toBe(false);
  });
});
