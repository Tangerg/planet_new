import { describe, expect, it } from "vitest";

import type { ProviderCapability } from "@domain/ports/provider";

import {
  artistMusicVideoDiscoveryQueryEnabled,
  artistMusicVideosQueryEnabled,
  musicVideoCommentsQueryEnabled,
  supportedContentQueryEnabled,
  trackCommentsQueryEnabled,
  userLibraryQueryEnabled,
} from "./content-query";

const supports =
  (...capabilities: ProviderCapability[]) =>
  (capability: ProviderCapability) =>
    capabilities.includes(capability);

describe("content query model", () => {
  it("enables account-scoped library reads only for logged-in supported providers", () => {
    expect(userLibraryQueryEnabled(true, true)).toBe(true);
    expect(userLibraryQueryEnabled(true, false)).toBe(false);
    expect(userLibraryQueryEnabled(false, true)).toBe(false);
  });

  it("combines request intent, target presence, and provider capability", () => {
    const provider = supports("comments");

    expect(
      supportedContentQueryEnabled({
        requested: true,
        hasTarget: true,
        capability: "comments",
        supports: provider,
      }),
    ).toBe(true);
    expect(
      supportedContentQueryEnabled({
        requested: false,
        hasTarget: true,
        capability: "comments",
        supports: provider,
      }),
    ).toBe(false);
    expect(
      supportedContentQueryEnabled({
        requested: true,
        hasTarget: false,
        capability: "comments",
        supports: provider,
      }),
    ).toBe(false);
    expect(
      supportedContentQueryEnabled({
        capability: "artistMusicVideos",
        supports: provider,
      }),
    ).toBe(false);
  });

  it("plans artist music-video discovery from artist ids and capability support", () => {
    expect(artistMusicVideoDiscoveryQueryEnabled(["a"], supports("artistMusicVideos"))).toBe(true);
    expect(artistMusicVideoDiscoveryQueryEnabled([], supports("artistMusicVideos"))).toBe(false);
    expect(artistMusicVideoDiscoveryQueryEnabled(["a"], supports("comments"))).toBe(false);
  });

  it("plans identified content queries only when requested and addressable", () => {
    const allMvCaps = supports("artistMusicVideos", "musicVideoComments", "comments");

    expect(artistMusicVideosQueryEnabled("artist", true, allMvCaps)).toBe(true);
    expect(artistMusicVideosQueryEnabled(undefined, true, allMvCaps)).toBe(false);
    expect(artistMusicVideosQueryEnabled("artist", false, allMvCaps)).toBe(false);

    expect(musicVideoCommentsQueryEnabled("mv", true, allMvCaps)).toBe(true);
    expect(musicVideoCommentsQueryEnabled(undefined, true, allMvCaps)).toBe(false);
    expect(musicVideoCommentsQueryEnabled("mv", true, supports("artistMusicVideos"))).toBe(false);

    expect(trackCommentsQueryEnabled("track", true, allMvCaps)).toBe(true);
    expect(trackCommentsQueryEnabled(undefined, true, allMvCaps)).toBe(false);
    expect(trackCommentsQueryEnabled("track", false, allMvCaps)).toBe(false);
  });
});
