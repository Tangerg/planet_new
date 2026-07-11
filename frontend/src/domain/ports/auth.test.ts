import { describe, expectTypeOf, it } from "vitest";

import type { AccountSnapshot } from "../model/account";
import type { IdentityGateway, IdentitySourcePort } from "./auth";

describe("Identity ports", () => {
  it("keep authentication isolated from catalog, playback and library", () => {
    expectTypeOf<ReturnType<IdentityGateway["account"]>>().toEqualTypeOf<
      Promise<AccountSnapshot | undefined>
    >();
    expectTypeOf<IdentityGateway>().not.toHaveProperty("search");
    expectTypeOf<IdentityGateway>().not.toHaveProperty("resolve");
    expectTypeOf<IdentityGateway>().not.toHaveProperty("likedTrackIds");

    expectTypeOf<ReturnType<IdentitySourcePort["active"]>>().toHaveProperty("identity");
    expectTypeOf<ReturnType<IdentitySourcePort["active"]>>().not.toHaveProperty("catalog");
  });
});
