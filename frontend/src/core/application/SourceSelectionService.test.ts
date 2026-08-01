import { describe, expect, expectTypeOf, it } from "vitest";

import { ProviderId } from "@domain";
import { SourceSelectionService, type SourceSelectionPort } from "./SourceSelectionService";

const FIRST = ProviderId.of("first");
const SECOND = ProviderId.of("second");

function sourceSelection() {
  const providers = [{ providerId: FIRST }, { providerId: SECOND }];
  let active = providers[0];
  const port: SourceSelectionPort = {
    get active() {
      return active;
    },
    providers,
    setActive(providerId) {
      const next = providers.find((provider) => provider.providerId === providerId);
      if (!next || next === active) return false;
      active = next;
      return true;
    },
  };
  return new SourceSelectionService(() => port);
}

describe("SourceSelectionService", () => {
  it("publishes identities and selection without exposing source capabilities", () => {
    const service = sourceSelection();

    expect(service.ids).toEqual([FIRST, SECOND]);
    expect(service.activeId).toBe(FIRST);
    expect(service.select(SECOND)).toBe(true);
    expect(service.activeId).toBe(SECOND);
    expect(service.select(SECOND)).toBe(false);
    expect(service.select(ProviderId.of("missing"))).toBe(false);

    expectTypeOf<SourceSelectionService>().not.toHaveProperty("active");
    expectTypeOf<SourceSelectionService>().not.toHaveProperty("providers");
    expectTypeOf<SourceSelectionService>().not.toHaveProperty("get");
  });
});
