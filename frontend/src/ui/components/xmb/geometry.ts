export const XMB_CAT_GAP = 172;
export const XMB_ANCHOR = "26%";
export const XMB_BAR_Y = "40%";
export const XMB_ROW = 58;
export const XMB_BELOW = 84;
export const XMB_ABOVE = 82;
export const XMB_AFTER_ACTIVE = 30;

export const XMB_EASE = "cubic-bezier(.22,1,.28,1)";
export const XMB_EASE_ARR = [0.22, 1, 0.28, 1] as const;

export function subItemTransform(o: number): { x: number; y: number } {
  const y =
    o >= 0
      ? XMB_BELOW + o * XMB_ROW + (o >= 1 ? XMB_AFTER_ACTIVE : 0)
      : -(XMB_ABOVE + (-o - 1) * XMB_ROW);
  const ad = Math.min(Math.abs(o), 3.4);
  const x = Math.round(36 * Math.sin(ad * 0.46));
  return { x, y };
}

export function categoryTransform(i: number, c: number): { y: number; rotate: number } {
  const d = Math.max(-7, Math.min(7, i - c));
  const y = Math.round(36 * (1 - Math.cos(d * 0.62)));
  const slopeMag = 36 * 0.62 * Math.sin(d * 0.62);
  const rotate =
    i === c
      ? 0
      : Math.max(-10, Math.min(10, Math.round(Math.atan2(slopeMag, XMB_CAT_GAP) * 57.3 * 0.95)));
  return { y, rotate };
}
