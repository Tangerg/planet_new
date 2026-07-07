import { describe, expect, it } from "vitest";

import { audioLanes } from "./lanes";

describe("audio lanes", () => {
  it("prepends a raw/overall lane, then frequency-band lanes low → high", () => {
    const lanes = audioLanes({ bands: [0, 0, 0, 0.5, 0.5, 0.5, 1, 1, 1] }, 3);

    expect(lanes).toHaveLength(4);

    const [raw, low, mid, high] = lanes;
    expect(raw).toMatchObject({ index: 0, raw: true });
    expect(raw.energy).toBeCloseTo(0.5); // mean of the whole mix

    expect(low).toMatchObject({ index: 1, raw: false });
    expect(low.energy).toBeCloseTo(0);
    expect(mid.energy).toBeCloseTo(0.5);
    expect(high.energy).toBeCloseTo(1);
  });

  it("reports zero overall energy for an empty spectrum", () => {
    const lanes = audioLanes({ bands: [] }, 2);
    expect(lanes[0]).toMatchObject({ index: 0, raw: true, energy: 0 });
    expect(lanes).toHaveLength(3);
  });
});
