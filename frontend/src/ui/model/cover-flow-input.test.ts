import { describe, expect, it } from "vitest";

import {
  clampCoverFlowCenter,
  coverFlowDragCenter,
  coverFlowDragStarted,
  coverFlowKeyAction,
  coverFlowWheelMotion,
  nextCoverFlowCenter,
} from "./cover-flow-input";

describe("cover flow input model", () => {
  it("clamps the center to the available item range", () => {
    expect(clampCoverFlowCenter(-2, 5)).toBe(0);
    expect(clampCoverFlowCenter(2, 5)).toBe(2);
    expect(clampCoverFlowCenter(8, 5)).toBe(4);
    expect(clampCoverFlowCenter(8, 0)).toBe(0);
  });

  it("moves one item at a time for keyboard navigation", () => {
    expect(nextCoverFlowCenter(2, 5, "previous")).toBe(1);
    expect(nextCoverFlowCenter(2, 5, "next")).toBe(3);
    expect(nextCoverFlowCenter(0, 5, "previous")).toBe(0);
    expect(nextCoverFlowCenter(4, 5, "next")).toBe(4);
  });

  it("accumulates horizontal wheel movement until the threshold is crossed", () => {
    expect(coverFlowWheelMotion(20, 30)).toEqual({ centerDelta: 0, accumulatedDelta: 50 });
    expect(coverFlowWheelMotion(50, 20)).toEqual({ centerDelta: 1, accumulatedDelta: 0 });
    expect(coverFlowWheelMotion(-50, -20)).toEqual({ centerDelta: -1, accumulatedDelta: 0 });
  });

  it("treats a small pointer travel as a click, larger as a drag", () => {
    // Below/at the threshold → still a click (leave the pointer uncaptured so the
    // card underneath stays clickable); beyond it → a drag.
    expect(coverFlowDragStarted(100, 100)).toBe(false);
    expect(coverFlowDragStarted(100, 103)).toBe(false);
    expect(coverFlowDragStarted(100, 96)).toBe(false);
    expect(coverFlowDragStarted(100, 106)).toBe(true);
    expect(coverFlowDragStarted(100, 92)).toBe(true);
  });

  it("derives the center from pointer drag distance", () => {
    expect(coverFlowDragCenter({ startCenter: 3, startX: 100, currentX: 230, itemCount: 6 })).toBe(
      2,
    );
    expect(coverFlowDragCenter({ startCenter: 3, startX: 100, currentX: -40, itemCount: 6 })).toBe(
      4,
    );
    expect(coverFlowDragCenter({ startCenter: 0, startX: 100, currentX: 400, itemCount: 6 })).toBe(
      0,
    );
  });

  it("maps keys to carousel actions only when the action is meaningful", () => {
    expect(coverFlowKeyAction({ key: "ArrowLeft", expanded: false, expandable: false })).toBe(
      "previous",
    );
    expect(coverFlowKeyAction({ key: "ArrowRight", expanded: false, expandable: false })).toBe(
      "next",
    );
    expect(coverFlowKeyAction({ key: "ArrowDown", expanded: false, expandable: true })).toBe(
      "expand",
    );
    expect(coverFlowKeyAction({ key: "ArrowDown", expanded: false, expandable: false })).toBe(
      "none",
    );
    expect(coverFlowKeyAction({ key: "ArrowUp", expanded: true, expandable: true })).toBe(
      "collapse",
    );
    expect(coverFlowKeyAction({ key: "ArrowUp", expanded: false, expandable: true })).toBe("none");
    expect(coverFlowKeyAction({ key: "Enter", expanded: false, expandable: true })).toBe("open");
  });
});
