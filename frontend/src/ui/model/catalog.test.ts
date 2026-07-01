import { describe, expect, test } from "vitest";

import { catalogScreenData, toVibeChart, toVibeCharts } from "./catalog";

describe("catalog UI model", () => {
  test("projects personalized domain data into screen data", () => {
    const data = catalogScreenData({
      playlists: [{ id: "p1", name: "Daily", images: [], tracks: [], totalTracks: 0 }],
      albums: [{ id: "a1", name: "Album", images: [], artists: [], tracks: [] }],
      artists: [{ id: "ar1", name: "Artist", images: [] }],
      tracks: [{ id: "t1", name: "Track", durationMs: 1000, artists: [{ name: "Singer" }] }],
    });

    expect(data.playlists[0]).toMatchObject({ id: "p1", name: "Daily", kind: "Playlist" });
    expect(data.albums[0]).toMatchObject({ id: "a1", name: "Album", kind: "Album" });
    expect(data.artists[0]).toMatchObject({ id: "ar1", name: "Artist" });
    expect(data.allTracks[0]).toMatchObject({ id: "t1", name: "Track", artist: "Singer" });
  });

  test("projects charts as collection summaries", () => {
    expect(
      toVibeChart({
        id: "chart-1",
        title: "Hot Songs",
        image: "https://example.com/chart.jpg",
        period: "weekly",
      }),
    ).toMatchObject({
      id: "chart-1",
      title: "Hot Songs",
      name: "Hot Songs",
      kind: "Chart",
      image: "https://example.com/chart.jpg",
      sub: "weekly",
      updatedAt: "weekly",
      tracks: [],
    });

    expect(toVibeCharts()).toEqual([]);
  });
});
