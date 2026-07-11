import { describe, expectTypeOf, it } from "vitest";

import type { AlbumDetailSnapshot } from "../model/album";
import type { ArtistDetailSnapshot } from "../model/artist";
import type { MusicVideoDetailSnapshot, MusicVideoSummary } from "../model/music-video";
import type { PlaylistDetailSnapshot } from "../model/playlist";
import type { TrackSnapshot } from "../model/track";
import type {
  AlbumReader,
  ArtistMusicVideoReader,
  ArtistReader,
  CatalogSource,
  MusicVideoReader,
  PlaylistReader,
  TrackReader,
} from "./catalog";

describe("CatalogSource port boundary", () => {
  it("contains catalog reads but excludes unrelated provider capabilities", () => {
    expectTypeOf<CatalogSource>().toHaveProperty("catalog");

    expectTypeOf<CatalogSource>().not.toHaveProperty("playUrls");
    expectTypeOf<CatalogSource>().not.toHaveProperty("lyric");
    expectTypeOf<CatalogSource>().not.toHaveProperty("beginLogin");
    expectTypeOf<CatalogSource>().not.toHaveProperty("likedTrackIds");
    expectTypeOf<CatalogSource>().not.toHaveProperty("engagement");
    expectTypeOf<CatalogSource>().not.toHaveProperty("capabilities");
    expectTypeOf<CatalogSource>().not.toHaveProperty("supports");
  });

  it("uses explicit summary and detail snapshots instead of partial entities", () => {
    expectTypeOf<ReturnType<PlaylistReader["playlistDetail"]>>().toEqualTypeOf<
      Promise<PlaylistDetailSnapshot | undefined>
    >();
    expectTypeOf<ReturnType<AlbumReader["albumDetail"]>>().toEqualTypeOf<
      Promise<AlbumDetailSnapshot | undefined>
    >();
    expectTypeOf<ReturnType<ArtistReader["artistDetail"]>>().toEqualTypeOf<
      Promise<ArtistDetailSnapshot | undefined>
    >();
    expectTypeOf<ReturnType<TrackReader["trackDetail"]>>().toEqualTypeOf<
      Promise<TrackSnapshot | undefined>
    >();
    expectTypeOf<ReturnType<TrackReader["trackDetails"]>>().toEqualTypeOf<
      Promise<TrackSnapshot[]>
    >();
    expectTypeOf<ReturnType<MusicVideoReader["musicVideoDetail"]>>().toEqualTypeOf<
      Promise<MusicVideoDetailSnapshot | undefined>
    >();
    expectTypeOf<ReturnType<ArtistMusicVideoReader["artistMusicVideos"]>>().toEqualTypeOf<
      Promise<MusicVideoSummary[]>
    >();
  });
});
