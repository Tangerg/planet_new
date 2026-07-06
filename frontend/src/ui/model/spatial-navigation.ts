export type SpatialDirection = "up" | "down" | "left" | "right";

export type SpatialRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type SpatialCandidate<T> = {
  item: T;
  rect: SpatialRect;
};

export const SPATIAL_MIN_PRIMARY_DISTANCE = 4;
export const SPATIAL_SECONDARY_WEIGHT = 2.2;

export function spatialDirectionFromKey(key: string): SpatialDirection | null {
  if (key === "ArrowUp") return "up";
  if (key === "ArrowDown") return "down";
  if (key === "ArrowLeft") return "left";
  if (key === "ArrowRight") return "right";
  return null;
}

export function shouldLetTextInputHandleArrow(key: string, tagName: string | undefined): boolean {
  if (tagName !== "INPUT" && tagName !== "TEXTAREA") return false;
  return key === "ArrowLeft" || key === "ArrowRight";
}

export function spatialCenter(rect: SpatialRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function spatialCandidateScore(
  current: SpatialRect,
  candidate: SpatialRect,
  direction: SpatialDirection,
): number | null {
  const currentCenter = spatialCenter(current);
  const candidateCenter = spatialCenter(candidate);
  const dx = candidateCenter.x - currentCenter.x;
  const dy = candidateCenter.y - currentCenter.y;

  let primary: number;
  let secondary: number;
  if (direction === "right") {
    if (dx <= SPATIAL_MIN_PRIMARY_DISTANCE) return null;
    primary = dx;
    secondary = Math.abs(dy);
  } else if (direction === "left") {
    if (dx >= -SPATIAL_MIN_PRIMARY_DISTANCE) return null;
    primary = -dx;
    secondary = Math.abs(dy);
  } else if (direction === "down") {
    if (dy <= SPATIAL_MIN_PRIMARY_DISTANCE) return null;
    primary = dy;
    secondary = Math.abs(dx);
  } else {
    if (dy >= -SPATIAL_MIN_PRIMARY_DISTANCE) return null;
    primary = -dy;
    secondary = Math.abs(dx);
  }

  return primary + secondary * SPATIAL_SECONDARY_WEIGHT;
}

export function nearestSpatialCandidate<T>(
  current: SpatialCandidate<T>,
  direction: SpatialDirection,
  candidates: readonly SpatialCandidate<T>[],
): T | null {
  let best: T | null = null;
  let bestScore = Infinity;

  for (const candidate of candidates) {
    if (candidate.item === current.item) continue;
    const score = spatialCandidateScore(current.rect, candidate.rect, direction);
    if (score === null || score >= bestScore) continue;
    bestScore = score;
    best = candidate.item;
  }

  return best;
}
