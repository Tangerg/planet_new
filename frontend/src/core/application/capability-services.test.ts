import { describe, expect, it, vi } from "vitest";

import { AuthService } from "./AuthService";
import { LibraryService } from "./LibraryService";
import {
  Playlist,
  SearchResult,
  type Account,
  type CredentialStore,
  type LoginFlow,
  type LoginStatus,
  type MusicProvider,
  type ProviderCapability,
  type Track,
} from "@domain";

function makeCredentials(): CredentialStore {
  const sessions = new Map<string, { token: string }>();
  return {
    get(provider) {
      return sessions.get(provider) ?? null;
    },
    set(provider, session) {
      sessions.set(provider, session);
    },
    clear(provider) {
      sessions.delete(provider);
    },
  };
}

function makeProvider(
  capabilities: ProviderCapability[],
  overrides: Partial<MusicProvider> & Record<string, unknown> = {},
): MusicProvider {
  const caps = new Set<ProviderCapability>(capabilities);
  const provider: MusicProvider = {
    name: "test",
    capabilities: caps,
    supports(cap) {
      return caps.has(cap);
    },
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
  return Object.assign(provider, overrides);
}

describe("AuthService capability port", () => {
  it("does not treat an auth capability string as an auth port by itself", async () => {
    const service = new AuthService(() => makeProvider(["auth"]), makeCredentials());

    expect(service.supported).toBe(false);
    expect(() => service.beginLogin()).toThrow("does not support auth");
  });

  it("uses a provider that actually implements the auth port", async () => {
    const flow: LoginFlow = {
      kind: "qr",
      image: "data:image/png;base64,qr",
      poll: vi.fn<() => Promise<LoginStatus>>(async () => ({ state: "pending" })),
    };
    const beginLogin = vi.fn<() => Promise<LoginFlow>>(async () => flow);
    const provider = makeProvider(["auth"], {
      beginLogin,
      account: vi.fn<() => Promise<Account>>(async () => ({ id: "u1", name: "Ada", avatar: [] })),
      logout: vi.fn<() => Promise<void>>(async () => {}),
    });
    const service = new AuthService(() => provider, makeCredentials());

    await expect(service.beginLogin()).resolves.toBe(flow);
    expect(beginLogin).toHaveBeenCalledTimes(1);
    expect(service.supported).toBe(true);
  });
});

describe("LibraryService capability port", () => {
  it("does not treat a userLibrary capability string as a library port by itself", async () => {
    const service = new LibraryService(() => makeProvider(["userLibrary"]));

    expect(service.supported).toBe(false);
    expect(() => service.likedTrackIds()).toThrow("has no user library");
  });

  it("uses a provider that actually implements the user library port", async () => {
    const likedTrackIds = vi.fn<() => Promise<string[]>>(async () => ["1", "2"]);
    const provider = makeProvider(["userLibrary"], {
      likedTrackIds,
      setLiked: vi.fn<(trackId: string, liked: boolean) => Promise<void>>(async () => {}),
      userPlaylists: vi.fn<() => Promise<Playlist[]>>(async () => []),
      playRecord: vi.fn<(period: "week" | "all") => Promise<Partial<Track>[]>>(async () => []),
      dailyRecommendations: vi.fn<() => Promise<Partial<Track>[]>>(async () => []),
    });
    const service = new LibraryService(() => provider);

    await expect(service.likedTrackIds()).resolves.toEqual(["1", "2"]);
    expect(likedTrackIds).toHaveBeenCalledTimes(1);
    expect(service.supported).toBe(true);
  });
});
