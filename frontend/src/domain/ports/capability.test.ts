import { describe, expect, test } from "vitest";

import {
  CORE_STREAMING_CAPABILITIES,
  missingCapabilities,
  providerCapabilityMatrix,
} from "./capability";
import { Playlist } from "../model/playlist";
import { SearchResult } from "../model/search";
import type { MusicProvider, ProviderCapability } from "./provider";

function provider(name: string, capabilities: ProviderCapability[]): MusicProvider {
  const caps = new Set<ProviderCapability>(capabilities);
  return {
    name,
    capabilities: caps,
    supports: (capability) => caps.has(capability),
    playlistDetail: async (id) => Playlist.empty(id),
    lyric: async () => [],
    albumDetail: async (id) => ({ id, name: "", images: [], artists: [], tracks: [] }),
    artistDetail: async (id) => ({ id, name: "", images: [] }),
    trackDetail: async () => undefined,
    trackDetails: async () => [],
    musicVideoDetail: async () => undefined,
    artistMusicVideos: async () => [],
    musicVideoComments: async () => [],
    playUrls: async () => [],
    personalized: async () => ({ playlists: [] }),
    search: async () => SearchResult.empty(),
    toplists: async () => [],
    toplistDetail: async (id) => Playlist.empty(id),
    comments: async () => [],
  };
}

describe("provider capability matrix", () => {
  test("projects provider support across an explicit capability set", () => {
    const rows = providerCapabilityMatrix(
      [provider("ncm", ["search", "fullPlayback"]), provider("local", ["fullPlayback"])],
      ["search", "fullPlayback"],
    );

    expect(rows).toEqual([
      { provider: "ncm", capability: "search", supported: true },
      { provider: "ncm", capability: "fullPlayback", supported: true },
      { provider: "local", capability: "search", supported: false },
      { provider: "local", capability: "fullPlayback", supported: true },
    ]);
  });

  test("keeps the shared matrix focused on streaming concerns", () => {
    expect(CORE_STREAMING_CAPABILITIES).toContain("playlistDetail");
    expect(CORE_STREAMING_CAPABILITIES).toContain("musicVideoDetail");
    expect(CORE_STREAMING_CAPABILITIES).not.toContain("djRadio" as ProviderCapability);
  });

  test("reports unsupported capabilities for one provider", () => {
    expect(missingCapabilities(provider("spotify", ["previewPlayback"]), ["fullPlayback"])).toEqual(
      ["fullPlayback"],
    );
  });
});
