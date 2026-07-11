import { describe, expectTypeOf, it } from "vitest";
import type { EngagementService, EngagementSource, LikesGateway } from ".";

describe("Engagement module public API", () => {
  it("exposes provider relationships without UI session state", () => {
    expectTypeOf<EngagementService>().toHaveProperty("likedTrackIds");
    expectTypeOf<EngagementService>().toHaveProperty("comments");
    expectTypeOf<LikesGateway>().toHaveProperty("setLiked");
    expectTypeOf<EngagementSource>().not.toHaveProperty("catalog");
    expectTypeOf<EngagementSource>().not.toHaveProperty("sessionHistory");
  });
});
