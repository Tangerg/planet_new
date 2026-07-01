// XMB cross-layout geometry — the constants and pure math behind the launcher's
// horizontal category rail and vertical sub-item column. Kept framework-free and
// side-effect-free so the layout is testable and the components stay declarative.

export const XMB_CAT_GAP = 172; // horizontal spacing between category icons
export const XMB_ANCHOR = "26%"; // x of the active category column (icon + its sub-item list)
export const XMB_BAR_Y = "40%"; // y of the horizontal category bar
export const XMB_ROW = 58; // sub-item row height
export const XMB_BELOW = 84; // selected sub-item sits this far below the bar
export const XMB_ABOVE = 82; // nearest passed sub-item sits this far above the bar
export const XMB_AFTER_ACTIVE = 30; // extra room below the active item for its underline + subtitle

export const XMB_EASE = "cubic-bezier(.22,1,.28,1)"; // soft easeOut, gentle settle
export const XMB_EASE_ARR = [0.22, 1, 0.28, 1] as const; // same curve for Motion (array form)

/**
 * Placement of a sub-item relative to the active row. `o` is the signed row
 * offset (0 = active, <0 = passed/above, >0 = upcoming/below). Passed items rise
 * above the bar, upcoming sink below; a gentle bow pushes non-active rows right.
 */
export function subItemTransform(o: number): { x: number; y: number } {
  const y =
    o >= 0
      ? XMB_BELOW + o * XMB_ROW + (o >= 1 ? XMB_AFTER_ACTIVE : 0)
      : -(XMB_ABOVE + (-o - 1) * XMB_ROW);
  const ad = Math.min(Math.abs(o), 3.4);
  const x = Math.round(36 * Math.sin(ad * 0.46));
  return { x, y };
}

/**
 * Placement of category icon `i` given the active index `c`. Icons follow a
 * cosine arch (flat-tangent crest at the active) and bank along the tangent
 * (active upright, slope 0 there).
 */
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
