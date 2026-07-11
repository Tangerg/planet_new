import { describe, expectTypeOf, it } from "vitest";

import type {
  AlbumDetailSnapshot,
  CatalogSource,
  MediaService,
  MusicVideoDetailSnapshot,
  PlaylistDetailSnapshot,
  TrackSnapshot,
} from ".";

describe("Catalog Context public API", () => {
  it("exposes catalog use cases, ports and complete read snapshots", () => {
    expectTypeOf<MediaService>().toHaveProperty("search");
    expectTypeOf<MediaService>().toHaveProperty("playlistDetail");
    expectTypeOf<CatalogSource>().toHaveProperty("catalog");
    expectTypeOf<PlaylistDetailSnapshot["tracks"]>().toEqualTypeOf<TrackSnapshot[]>();
    expectTypeOf<AlbumDetailSnapshot["tracks"]>().toEqualTypeOf<TrackSnapshot[]>();
    expectTypeOf<MusicVideoDetailSnapshot>().toHaveProperty("providerId");
    expectTypeOf<MediaService>().not.toHaveProperty("play");
    expectTypeOf<CatalogSource>().not.toHaveProperty("playback");
    expectTypeOf<CatalogSource>().not.toHaveProperty("engagement");
  });
});
