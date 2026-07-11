import { describe, expect, it } from "vitest";

import { Planet, type AudioRuntimePort } from "@core";
import { MUSIC_SOURCE } from "@core/plugin";
import type { CatalogPorts, EngagementPorts, ProviderId } from "@domain";
import { LocalMusic, NeteaseCloudMusic, QQMusic, Spotify } from ".";
import type { Provider } from ".";

type CatalogSlot = keyof CatalogPorts;

const PORT_METHODS: Record<CatalogSlot, readonly string[]> = {
  home: ["personalized"],
  playlists: ["playlistDetail"],
  albums: ["albumDetail"],
  artists: ["artistDetail"],
  tracks: ["trackDetail", "trackDetails"],
  search: ["search"],
  charts: ["toplists", "toplistDetail"],
  musicVideos: ["musicVideoDetail"],
  artistMusicVideos: ["artistMusicVideos"],
};

const ALL_CATALOG_SLOTS = Object.keys(PORT_METHODS) as CatalogSlot[];

type EngagementSlot = keyof EngagementPorts;
const ENGAGEMENT_METHODS: Record<EngagementSlot, readonly string[]> = {
  likes: ["likedTrackIds", "setLiked"],
  playHistory: ["playRecord"],
  trackComments: ["comments"],
  musicVideoComments: ["musicVideoComments"],
};
const ALL_ENGAGEMENT_SLOTS = Object.keys(ENGAGEMENT_METHODS) as EngagementSlot[];

function audioRuntime(): AudioRuntimePort {
  return {
    audioElement: {} as HTMLAudioElement,
    audioContext: {} as AudioContext,
    createAnalysisElement: () => ({}) as HTMLAudioElement,
    dispose() {},
  };
}

type ProviderCase = {
  label: string;
  create: () => Provider;
  providerId: ProviderId;
  catalog: readonly CatalogSlot[];
  lyrics: boolean;
  identity: boolean;
  userLibrary: boolean;
  engagement: readonly EngagementSlot[];
  playback: { canResolveFullPlayback: boolean; canUsePreviewPlayback: boolean };
};

const cases: ProviderCase[] = [
  {
    label: "LocalMusic",
    create: () => new LocalMusic(),
    providerId: LocalMusic.ID,
    catalog: ["home", "playlists", "albums", "artists", "tracks", "search"],
    lyrics: true,
    identity: false,
    userLibrary: false,
    engagement: [],
    playback: { canResolveFullPlayback: true, canUsePreviewPlayback: false },
  },
  {
    label: "NeteaseCloudMusic",
    create: () => new NeteaseCloudMusic({ host: "http://localhost:3000" }),
    providerId: NeteaseCloudMusic.ID,
    catalog: ALL_CATALOG_SLOTS,
    lyrics: true,
    identity: true,
    userLibrary: true,
    engagement: ALL_ENGAGEMENT_SLOTS,
    playback: { canResolveFullPlayback: true, canUsePreviewPlayback: false },
  },
  {
    label: "QQMusic",
    create: () => new QQMusic({ host: "http://localhost:3200" }),
    providerId: QQMusic.ID,
    catalog: ["home", "playlists", "albums", "artists", "search", "charts"],
    lyrics: true,
    identity: false,
    userLibrary: false,
    engagement: [],
    playback: { canResolveFullPlayback: true, canUsePreviewPlayback: false },
  },
  {
    label: "Spotify",
    create: () => new Spotify({ clientId: "test", clientSecret: "test" }),
    providerId: Spotify.ID,
    catalog: ["home", "playlists", "albums", "artists"],
    lyrics: false,
    identity: false,
    userLibrary: false,
    engagement: [],
    playback: { canResolveFullPlayback: false, canUsePreviewPlayback: true },
  },
];

describe.each(cases)("$label source adapter contract", (providerCase) => {
  it("registers stable identity and only real context ports", async () => {
    const adapter = providerCase.create();
    const planet = new Planet({ audio: audioRuntime(), plugins: [adapter] });
    try {
      const [source] = planet.resolveAll(MUSIC_SOURCE);
      expect(source.providerId).toBe(providerCase.providerId);
      expect(source.name).toBe(adapter.name);
      expect(source.playback).toMatchObject({
        providerId: providerCase.providerId,
        diagnosticName: adapter.name,
        policy: providerCase.playback,
      });
      await expect(source.playback.resolve([])).resolves.toEqual([]);

      for (const slot of ALL_CATALOG_SLOTS) {
        const port = source.catalog[slot];
        expect({ registered: port !== null, slot }).toEqual({
          registered: providerCase.catalog.includes(slot),
          slot,
        });
        if (!port) continue;
        for (const method of PORT_METHODS[slot]) {
          expect({
            method,
            slot,
            type: typeof (port as unknown as Record<string, unknown>)[method],
          }).toEqual({ method, slot, type: "function" });
        }
      }

      expect(source.lyrics !== null).toBe(providerCase.lyrics);
      expect(source.identity !== null).toBe(providerCase.identity);
      expect(source.userLibrary !== null).toBe(providerCase.userLibrary);
      for (const slot of ALL_ENGAGEMENT_SLOTS) {
        const port = source.engagement[slot];
        expect({ registered: port !== null, slot }).toEqual({
          registered: providerCase.engagement.includes(slot),
          slot,
        });
        if (!port) continue;
        for (const method of ENGAGEMENT_METHODS[slot]) {
          expect(typeof (port as unknown as Record<string, unknown>)[method]).toBe("function");
        }
      }
      expect("capabilities" in source).toBe(false);
      expect("supports" in source).toBe(false);
    } finally {
      planet.dispose();
    }
  });
});
