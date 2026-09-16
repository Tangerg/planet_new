import { clampIndex } from "@shared/number";

export const COVER_FLOW_WHEEL_THRESHOLD = 60;
export const COVER_FLOW_DRAG_STEP_PX = 120;
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
