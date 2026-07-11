import { describe, expectTypeOf, it } from "vitest";

import type { EngagementSource, LikesGateway, PlayHistoryReader } from "./engagement";
import type { TrackSnapshot } from "../model/track";

describe("Engagement ports", () => {
  it("separates user relationships from catalog and account-library browsing", () => {
    expectTypeOf<EngagementSource>().toHaveProperty("engagement");
    expectTypeOf<LikesGateway>().toHaveProperty("setLiked");
    expectTypeOf<ReturnType<PlayHistoryReader["playRecord"]>>().toEqualTypeOf<
      Promise<TrackSnapshot[]>
    >();

    expectTypeOf<EngagementSource>().not.toHaveProperty("catalog");
    expectTypeOf<LikesGateway>().not.toHaveProperty("userPlaylists");
    expectTypeOf<PlayHistoryReader>().not.toHaveProperty("dailyRecommendations");
  });
});
