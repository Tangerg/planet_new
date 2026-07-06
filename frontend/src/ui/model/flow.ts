export function clampFlowCenter(center: number, itemCount: number): number {
  if (itemCount <= 0) return 0;
  return Math.min(Math.max(0, center), itemCount - 1);
}
