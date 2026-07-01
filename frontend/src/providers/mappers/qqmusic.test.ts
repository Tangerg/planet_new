import { describe, expect, it } from "vitest";

import {
  albumImage,
  mapQQChart,
  mapQQPlaylistDetail,
  mapQQRankSong,
  mapQQSmartboxSong,
  singerImage,
} from "./qqmusic";

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
    expect(albumImage(99, 500)).toContain("T002R500x500M00099.jpg");
    expect(singerImage(88, 300)).toContain("T001R300x300M00088.jpg");
  });
});
