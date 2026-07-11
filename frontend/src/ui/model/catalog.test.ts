import { describe, expect, test } from "vitest";

import { catalogScreenData, toVibeChart, toVibeCharts } from "./catalog";
import { ProviderId } from "@domain/model/provider-id";

const TEST_PROVIDER_ID = ProviderId.of("test");

describe("catalog UI model", () => {
  test("projects personalized domain data into screen data", () => {
    const data = catalogScreenData({
      playlists: [
        {
          providerId: TEST_PROVIDER_ID,
          id: "p1",
          name: "Daily",
          images: [],
          tracks: [],
          totalTracks: 0,
        },
      ],
      albums: [
        {
          providerId: TEST_PROVIDER_ID,
          id: "a1",
          name: "Album",
          images: [],
          artists: [],
          tracks: [],
        },
      ],
      artists: [{ providerId: TEST_PROVIDER_ID, id: "ar1", name: "Artist", images: [] }],
      tracks: [
        {
          providerId: TEST_PROVIDER_ID,
          id: "t1",
          name: "Track",
          durationMs: 1000,
          artists: [{ providerId: TEST_PROVIDER_ID, name: "Singer" }],
        },
      ],
    });

    expect(data.playlists[0]).toMatchObject({ id: "p1", name: "Daily", kind: "Playlist" });
    expect(data.albums[0]).toMatchObject({ id: "a1", name: "Album", kind: "Album" });
    expect(data.artists[0]).toMatchObject({ id: "ar1", name: "Artist" });
    expect(data.allTracks[0]).toMatchObject({ id: "t1", name: "Track", artist: "Singer" });
  });

  test("projects charts as collection summaries", () => {
    expect(
      toVibeChart({
        providerId: TEST_PROVIDER_ID,
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
