import { describe, expect, it } from "vitest";

import type { MusicVideoAvailabilityPolicy } from "@domain/model/music-video";

import type { VibeComment, VibeMusicVideo } from "./vibe";
import {
  musicVideoCommentLabel,
  musicVideoDetailModel,
  musicVideoMetaPieces,
  musicVideoQualityLabel,
  musicVideosScreenModel,
  musicVideoTheaterModel,
  relatedMusicVideoRail,
} from "./music-video-screen";

const policy: MusicVideoAvailabilityPolicy = { canResolvePlayback: true };

const video = (id: string, overrides: Partial<VibeMusicVideo> = {}): VibeMusicVideo => ({
  id,
  title: id,
  name: id,
  artist: "Artist",
  coverSeed: 1,
  duration: "03:00",
  durSec: 180,
  ...overrides,
});

const comment = (id: string): VibeComment => ({
  id,
  name: id,
  content: id,
  likedCount: 0,
  timeLabel: "now",
});

describe("music video screen model", () => {
  it("splits the hub into featured/rest/related states", () => {
    const a = video("a");
    const b = video("b");

    expect(musicVideosScreenModel([], true)).toMatchObject({ state: "loading" });
    expect(musicVideosScreenModel([], false)).toMatchObject({ state: "empty" });
    expect(musicVideosScreenModel([a, b], false)).toMatchObject({
      state: "ready",
      featured: { id: "a" },
      rest: [{ id: "b" }],
      related: [{ id: "a" }, { id: "b" }],
    });
  });

  it("builds a related rail without the current video and within a limit", () => {
    expect(
      relatedMusicVideoRail([video("a"), video("b"), video("c")], "b", 1).map((item) => item.id),
    ).toEqual(["a"]);
  });

  it("derives detail availability, artist, comment label, and rail", () => {
    const current = video("a", {
      artists: [{ id: "artist", name: "Artist" }],
      commentCount: 1234,
      playUrl: "https://example.com/mv.mp4",
    });

    expect(musicVideoDetailModel(current, [current, video("b")], policy)).toMatchObject({
      artist: { id: "artist" },
      canPlay: true,
      commentLabel: { key: "counts.comments", values: { value: "1.2K" } },
      rail: [{ id: "b" }],
    });
    expect(musicVideoCommentLabel(0)).toBeUndefined();
  });

  it("names compact MV metadata parts", () => {
    expect(
      musicVideoMetaPieces(video("mv", { duration: "04:20", playCount: 15320, quality: 1080 })),
    ).toEqual([
      { text: "1080P" },
      { text: "04:20" },
      { key: "counts.plays", values: { value: "15.3K" } },
    ]);
    // No play count and no duration: only the quality fallback survives the join.
    expect(musicVideoMetaPieces(video("mv", { duration: "", playCount: 0 }))).toEqual([
      { text: "MV" },
      { text: "" },
    ]);
  });

  it("derives theater playback and comment model", () => {
    const model = musicVideoTheaterModel({
      comments: Array.from({ length: 16 }, (_, index) => comment(String(index))),
      durationSec: 0,
      playbackPolicy: policy,
      positionSec: 45,
      video: video("mv", { durSec: 180, playUrl: "https://example.com/mv.mp4", quality: 1080 }),
    });

    expect(model).toMatchObject({
      hasStream: true,
      progress: 0.25,
      qualityLabel: "1080P",
      totalSec: 180,
    });
    expect(model.commentsPreview).toHaveLength(14);
    expect(musicVideoQualityLabel(video("mv"))).toBe("MV");
  });
});
