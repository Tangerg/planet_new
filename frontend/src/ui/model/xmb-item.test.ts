import { describe, expect, it } from "vitest";

import { xmbItemVisualState } from "./xmb-item";

describe("XMB item visual state", () => {
  it("projects the active row into the expanded focus state", () => {
    expect(xmbItemVisualState(true, 0)).toEqual({
      opacity: 1,
      gap: 22,
      iconSize: 52,
      iconRadius: 12,
      iconShadow: "active",
      nearBlur: false,
      titleFontSize: 27,
      titleLetterSpacing: ".02em",
      titleColor: "#fff",
      titleMaxWidth: 600,
    });
  });

  it("uses asymmetric fading and blurs only immediate neighbours", () => {
    const previous = xmbItemVisualState(false, -1);
    const next = xmbItemVisualState(false, 1);
    expect(previous.opacity).toBeCloseTo(0.27);
    expect(previous.nearBlur).toBe(true);
    expect(next.opacity).toBeCloseTo(0.41);
    expect(next.nearBlur).toBe(true);
    expect(xmbItemVisualState(false, -4)).toMatchObject({ opacity: 0.14, nearBlur: false });
    expect(xmbItemVisualState(false, 4)).toMatchObject({ opacity: 0.14, nearBlur: false });
  });
});
