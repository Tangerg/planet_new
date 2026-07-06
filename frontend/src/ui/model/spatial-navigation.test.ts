import { describe, expect, it } from "vitest";

import {
  nearestSpatialCandidate,
  shouldLetTextInputHandleArrow,
  spatialCandidateScore,
  spatialDirectionFromKey,
  type SpatialCandidate,
  type SpatialRect,
} from "./spatial-navigation";

const rect = (left: number, top: number, width = 10, height = 10): SpatialRect => ({
  left,
  top,
  width,
  height,
});

const candidate = (id: string, r: SpatialRect): SpatialCandidate<string> => ({
  item: id,
  rect: r,
});

describe("spatial navigation model", () => {
  it("maps arrow keys to spatial directions", () => {
    expect(spatialDirectionFromKey("ArrowUp")).toBe("up");
    expect(spatialDirectionFromKey("ArrowDown")).toBe("down");
    expect(spatialDirectionFromKey("ArrowLeft")).toBe("left");
    expect(spatialDirectionFromKey("ArrowRight")).toBe("right");
    expect(spatialDirectionFromKey("Enter")).toBeNull();
  });

  it("lets text inputs keep horizontal caret navigation", () => {
    expect(shouldLetTextInputHandleArrow("ArrowLeft", "INPUT")).toBe(true);
    expect(shouldLetTextInputHandleArrow("ArrowRight", "TEXTAREA")).toBe(true);
    expect(shouldLetTextInputHandleArrow("ArrowUp", "INPUT")).toBe(false);
    expect(shouldLetTextInputHandleArrow("ArrowLeft", "BUTTON")).toBe(false);
  });

  it("scores only candidates in the requested direction", () => {
    const current = rect(0, 0);

    expect(spatialCandidateScore(current, rect(20, 0), "right")).toBe(20);
    expect(spatialCandidateScore(current, rect(-20, 0), "right")).toBeNull();
    expect(spatialCandidateScore(current, rect(3, 0), "right")).toBeNull();
  });

  it("chooses the nearest candidate with secondary-axis weighting", () => {
    const current = candidate("current", rect(0, 0));
    const candidates = [
      current,
      candidate("behind", rect(-30, 0)),
      candidate("diagonal", rect(15, 20)),
      candidate("straight", rect(20, 0)),
    ];

    expect(nearestSpatialCandidate(current, "right", candidates)).toBe("straight");
  });

  it("returns null when no candidate lives in that direction", () => {
    const current = candidate("current", rect(0, 0));

    expect(nearestSpatialCandidate(current, "up", [current, candidate("below", rect(0, 20))])).toBe(
      null,
    );
  });
});
