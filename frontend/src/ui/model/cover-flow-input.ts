import { clampIndex } from "@shared/number";

export const COVER_FLOW_WHEEL_THRESHOLD = 60;
export const COVER_FLOW_DRAG_STEP_PX = 120;
/** Horizontal travel (px) that promotes a pointer press from a click to a drag. */
export const COVER_FLOW_DRAG_THRESHOLD_PX = 4;

export type CoverFlowMove = "previous" | "next";

export type CoverFlowKeyAction = "previous" | "next" | "expand" | "collapse" | "open" | "none";

export function nextCoverFlowCenter(
  center: number,
  itemCount: number,
  move: CoverFlowMove,
): number {
  return clampIndex(center + (move === "next" ? 1 : -1), itemCount);
}

export function coverFlowWheelMotion(
  accumulatedDelta: number,
  deltaX: number,
  threshold = COVER_FLOW_WHEEL_THRESHOLD,
): { centerDelta: -1 | 0 | 1; accumulatedDelta: number } {
  const nextDelta = accumulatedDelta + deltaX;
  if (nextDelta > threshold) return { centerDelta: 1, accumulatedDelta: 0 };
  if (nextDelta < -threshold) return { centerDelta: -1, accumulatedDelta: 0 };
  return { centerDelta: 0, accumulatedDelta: nextDelta };
}

/**
 * Whether a pointer press has moved far enough to count as a drag (vs a click).
 * Below the threshold the carousel must NOT capture the pointer, so the press
 * stays a plain click that reaches the card / play fab underneath — capturing on
 * every pointerdown redirects the follow-up `click` to the capturing container
 * and swallows the card's own handler.
 */
export function coverFlowDragStarted(
  startX: number,
  currentX: number,
  threshold = COVER_FLOW_DRAG_THRESHOLD_PX,
): boolean {
  return Math.abs(currentX - startX) > threshold;
}

export function coverFlowDragCenter({
  currentX,
  itemCount,
  startCenter,
  startX,
  stepPx = COVER_FLOW_DRAG_STEP_PX,
}: {
  currentX: number;
  itemCount: number;
  startCenter: number;
  startX: number;
  stepPx?: number;
}): number {
  const deltaX = currentX - startX;
  return clampIndex(startCenter - Math.round(deltaX / stepPx), itemCount);
}

export function coverFlowKeyAction({
  expandable,
  expanded,
  key,
}: {
  expandable: boolean;
  expanded: boolean;
  key: string;
}): CoverFlowKeyAction {
  if (key === "ArrowLeft") return "previous";
  if (key === "ArrowRight") return "next";
  if (key === "ArrowDown") return expandable ? "expand" : "none";
  if (key === "ArrowUp") return expanded ? "collapse" : "none";
  if (key === "Enter") return "open";
  return "none";
}
