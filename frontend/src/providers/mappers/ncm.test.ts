import { describe, expect, it } from "vitest";

import { mapNcmMusicVideo, mapNcmTrack } from "./ncm";

describe("NCM mapper", () => {
  it("maps linked music-video id from a track node", () => {
    const track = mapNcmTrack({
      id: 347230,
      name: "海阔天空",
      dt: 326000,
      mv: 5436712,
      ar: [{ id: 11127, name: "Beyond" }],
      al: { id: 123, name: "乐与怒", picUrl: "http://p1.music.126.net/cover.jpg" },
    });

    expect(track.musicVideoId).toBe("5436712");
    expect(track.album?.images?.[0]?.url).toContain("https://");
  });

  it("maps a music-video node into the domain model", () => {
    const mv = mapNcmMusicVideo(
      {
        id: 5436712,
        name: "广岛之恋",
        cover: "http://p1.music.126.net/mv.jpg",
        duration: 245000,
        artistName: "莫文蔚",
        artistId: 8926,
        playCount: 1000,
      },
      {
        playUrl: "https://example.com/mv.mp4",
        quality: 1080,
        counts: { commentCount: 12, likedCount: 34, shareCount: 56 },
      },
    );

    expect(mv).toMatchObject({
      id: "5436712",
      name: "广岛之恋",
      playUrl: "https://example.com/mv.mp4",
      quality: 1080,
      playCount: 1000,
      commentCount: 12,
      likedCount: 34,
      shareCount: 56,
    });
    expect(mv.artists[0]).toEqual({ id: "8926", name: "莫文蔚" });
    expect(mv.images[0]?.url).toContain("https://");
  });

  it("tolerates a bare track payload with safe domain defaults", () => {
    const track = mapNcmTrack({});
    expect(track).toMatchObject({ id: "", name: "", durationMs: 0, artists: [] });
    expect(track.album).toBeUndefined();
    expect(track.musicVideoId).toBeUndefined();
  });

  it("translates NCM fee / noCopyrightRcmd into neutral availability facts", () => {
    // fee 1 = VIP tier → requiresSubscription; licensed → available.
    expect(mapNcmTrack({ id: 1, fee: 1 })).toMatchObject({
      requiresSubscription: true,
      available: true,
    });
    // Free tier, no licence flag → no subscription, still available.
    expect(mapNcmTrack({ id: 2, fee: 0 })).toMatchObject({
      requiresSubscription: false,
      available: true,
    });
    // noCopyrightRcmd present → not licensed for playback.
    expect(mapNcmTrack({ id: 3, noCopyrightRcmd: { type: 0 } }).available).toBe(false);
  });
});
