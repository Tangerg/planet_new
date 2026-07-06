import { describe, expect, it } from "vitest";

import { clampFlowCenter } from "./flow";

describe("flow model", () => {
  it("keeps the flow center inside the available item range", () => {
    expect(clampFlowCenter(2, 0)).toBe(0);
    expect(clampFlowCenter(-1, 3)).toBe(0);
    expect(clampFlowCenter(1, 3)).toBe(1);
    expect(clampFlowCenter(9, 3)).toBe(2);
  });
});
