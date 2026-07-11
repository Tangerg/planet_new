import { describe, expect, it } from "vitest";

import {
  albumImage,
  mapQQAlbumDetail,
  mapQQArtistFromList,
  mapQQChart,
  mapQQNewAlbum,
  mapQQPlaylistDetail,
  mapQQPlaylistStub,
  mapQQRankSong,
  mapQQSmartboxSong,
  mapQQTrackFromAlbumList,
  mapQQTrackFromSong,
  singerImage,
} from "./mapper";
import { QQMUSIC_PROVIDER_ID } from "./identity";

describe("QQ Music mapper", () => {
  it("normalizes mixed Tencent ids and upgrades playlist artwork to https", () => {
    const playlist = mapQQPlaylistDetail({
      disstid: 42,
      dissname: "夜航歌单",
      desc: "late listening",
      logo: "http://qpic.y.qq.com/cover.jpg",
      songnum: 1,
      encrypt_uin: 901,
      nickname: "Ada",
      songlist: [
        {
          mid: "song-mid",
          name: "Shape of You",
          interval: 210,
          singer: [{ mid: 17, name: "J.Fla" }],
          album: { mid: "album-mid", pmid: "pmid", name: "Covers" },
        },
      ],
    });

    expect(playlist).toMatchObject({
      id: "42",
      name: "夜航歌单",
      description: "late listening",
      totalTracks: 1,
      owner: { id: "901", displayName: "Ada" },
    });
    expect(playlist.images[0]?.url).toBe("https://qpic.y.qq.com/cover.jpg");
    expect(playlist.tracks[0]).toMatchObject({
      id: "song-mid",
      playbackId: "song-mid",
      name: "Shape of You",
      durationMs: 210000,
      artists: [{ id: "17", name: "J.Fla" }],
      album: { id: "album-mid", name: "Covers" },
    });
  });

  it("maps search and chart payloads without leaking raw field names", () => {
    expect(
      mapQQSmartboxSong({ mid: 1001, name: "<em>晴天</em>", singer: "<em>周杰伦</em>" }),
    ).toMatchObject({
      id: "1001",
      playbackId: "1001",
      name: "晴天",
      artists: [{ name: "周杰伦" }],
    });

    expect(
      mapQQChart({
        topId: 26,
        topTitle: "热歌榜",
        frontPicUrl: "http://y.qq.com/chart.jpg",
        updateTime: "2026-07-01",
      }),
    ).toEqual({
      providerId: "qqmusic",
      id: "26",
      title: "热歌榜",
      image: "https://y.qq.com/chart.jpg",
      period: "2026-07-01",
    });
  });

  it("maps rank songs and image builders with string-safe ids", () => {
    const song = mapQQRankSong(
      {
        songId: 300,
        title: "红豆",
        interval: 240,
        singerName: "王菲",
        singerMid: 88,
        albumMid: 99,
      },
      7,
    );

    expect(song).toMatchObject({
      index: 7,
      id: "300",
      name: "红豆",
      durationMs: 240000,
      artists: [{ id: "88", name: "王菲" }],
      album: { id: "99" },
    });
    expect(song.playbackId).toBeUndefined();
    expect(albumImage(99, 500)).toContain("T002R500x500M00099.jpg");
    expect(singerImage(88, 300)).toContain("T001R300x300M00088.jpg");

    expect(mapQQRankSong({ songId: 300, mid: "song-mid" })).toMatchObject({
      id: "300",
      playbackId: "song-mid",
    });
  });

  it("tolerates bare song payloads with safe domain defaults", () => {
    expect(mapQQTrackFromSong({})).toMatchObject({
      id: "",
      name: "",
      durationMs: 0,
      artists: [],
    });
    // No cover fields → singleImage("") collapses to an empty image list, not [{url:""}].
    expect(mapQQRankSong({}).album?.images).toEqual([]);
  });

  it("never creates empty image records at optional artwork boundaries", () => {
    expect(mapQQPlaylistDetail({}).images).toEqual([]);
    expect(mapQQPlaylistStub({}).images).toEqual([]);
  });

  it("preserves epoch release dates and rejects malformed dates", () => {
    expect(mapQQAlbumDetail({ mid: "epoch", aDate: "1970-01-01" }).releaseDate).toBe("1970-01-01");
    expect(mapQQAlbumDetail({ mid: "invalid", aDate: "not-a-date" }).releaseDate).toBeUndefined();
  });

  it("normalizes alternate singer fields through one artist mapper", () => {
    expect(mapQQArtistFromList({ mid: 0, name: "Zero" })).toMatchObject({
      id: "0",
      name: "Zero",
    });
    expect(singerImage(0)).toContain("M0000.jpg");
    expect(albumImage(0)).toContain("M0000.jpg");

    const track = mapQQTrackFromAlbumList(
      {
        title: "Alternate title",
        songmid: "song-mid",
        singer: [{ singer_mid: 17, singer_name: "Singer" }],
      },
      { providerId: QQMUSIC_PROVIDER_ID, id: "album", name: "Album" },
    );
    expect(track).toMatchObject({
      name: "Alternate title",
      artists: [{ providerId: "qqmusic", id: "17", name: "Singer" }],
    });

    expect(
      mapQQNewAlbum({ mid: "album", singers: [{ singer_mid: 8, singer_name: "A" }] }),
    ).toMatchObject({ artists: [{ id: "8", name: "A" }] });
  });
});
