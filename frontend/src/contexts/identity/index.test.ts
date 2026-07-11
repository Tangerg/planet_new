import { describe, expectTypeOf, it } from "vitest";
import type { AccountSnapshot, IdentityGateway, IdentityService } from ".";

describe("Identity Context public API", () => {
  it("exposes identity use cases without other contexts", () => {
    expectTypeOf<IdentityService>().toHaveProperty("providerId");
    expectTypeOf<IdentityService>().toHaveProperty("beginLogin");
    expectTypeOf<AccountSnapshot>().toHaveProperty("id");
    expectTypeOf<IdentityGateway>().not.toHaveProperty("catalog");
    expectTypeOf<IdentityService>().not.toHaveProperty("play");
  });
});
