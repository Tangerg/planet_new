import { describe, expect, it } from "vitest";

import { SHELL_SCREEN_VIEWS, resolveShellScreen } from "./shell-screen";
import type { DetailTarget, VibeMusicVideo } from "./vibe";

const detail: DetailTarget = {
  id: "detail-1",
  name: "Detail",
  kind: "Playlist",
  tracks: [],
  coverSeed: 1,
  gradient: ["#111", "#eee"],
  images: [],
};

const video: VibeMusicVideo = {
  id: "video-1",
  name: "Video",
  title: "Video",
  artist: "Artist",
  artists: [],
  coverSeed: 1,
  images: [],
  duration: "0:01",
  durSec: 1,
};

describe("shell screen routing", () => {
  it("recognizes every declared static view", () => {
    const staticViews = SHELL_SCREEN_VIEWS.filter(
      (view) => view !== "detail" && view !== "mv-detail" && view !== "mv-theater",
    );

    expect(staticViews.map((view) => resolveShellScreen(view, null, null)?.kind)).toEqual(
      staticViews,
    );
  });

  it("attaches required payloads to data-backed routes", () => {
    expect(resolveShellScreen("detail", detail, null)).toEqual({ kind: "detail", detail });
    expect(resolveShellScreen("mv-detail", null, video)).toEqual({
      kind: "mv-detail",
      video,
    });
    expect(resolveShellScreen("mv-theater", null, video)).toEqual({
      kind: "mv-theater",
      video,
    });
  });

  it("rejects unknown views and data-backed views without payloads", () => {
    expect(resolveShellScreen("unknown", detail, video)).toBeNull();
    expect(resolveShellScreen("detail", null, video)).toBeNull();
    expect(resolveShellScreen("mv-detail", detail, null)).toBeNull();
    expect(resolveShellScreen("mv-theater", detail, null)).toBeNull();
  });
});
