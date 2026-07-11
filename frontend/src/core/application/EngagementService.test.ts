import { describe, expect, it, vi } from "vitest";

import {
  ProviderId,
  type EngagementPorts,
  type EngagementSource,
  type TrackSnapshot,
} from "@domain";
import { EngagementService } from "./EngagementService";

const PROVIDER_ID = ProviderId.of("test");
const EMPTY_PORTS: EngagementPorts = {
  likes: null,
  playHistory: null,
  trackComments: null,
  musicVideoComments: null,
};

function source(ports: Partial<EngagementPorts> = {}): EngagementSource {
  return {
    providerId: PROVIDER_ID,
    name: "test",
    engagement: { ...EMPTY_PORTS, ...ports },
  };
}

describe("EngagementService", () => {
  it("distinguishes unsupported relationships from successful empty data", async () => {
    const unsupported = new EngagementService(() => source());
    await expect(unsupported.likedTrackIds()).resolves.toEqual({ status: "unsupported" });
    await expect(unsupported.comments("track")).resolves.toEqual({ status: "unsupported" });

    const supported = new EngagementService(() =>
      source({
        likes: { likedTrackIds: async () => [], setLiked: async () => {} },
        trackComments: { comments: async () => [] },
      }),
    );
    await expect(supported.likedTrackIds()).resolves.toEqual({ status: "success", data: [] });
    await expect(supported.comments("track")).resolves.toEqual({ status: "success", data: [] });
  });

  it("keeps provider failures and mutations on the engagement boundary", async () => {
    const cause = new Error("offline");
    const setLiked = vi.fn<(trackId: string, liked: boolean) => Promise<void>>(async () => {});
    const service = new EngagementService(() =>
      source({
        likes: {
          likedTrackIds: async () => {
            throw cause;
          },
          setLiked,
        },
        playHistory: {
          playRecord: async (): Promise<TrackSnapshot[]> => {
            throw cause;
          },
        },
      }),
    );

    await expect(service.likedTrackIds()).resolves.toMatchObject({
      status: "failed",
      error: { operation: "likedTrackIds", cause },
    });
    await expect(service.playRecord("week")).resolves.toMatchObject({ status: "failed" });
    await service.setLiked("track", true);
    expect(setLiked).toHaveBeenCalledWith("track", true);
  });

  it("projects availability from real registered engagement ports", () => {
    const service = new EngagementService(() =>
      source({ musicVideoComments: { musicVideoComments: async () => [] } }),
    );
    expect(service.availability).toEqual({
      likes: false,
      playHistory: false,
      trackComments: false,
      musicVideoComments: true,
    });
  });
});
