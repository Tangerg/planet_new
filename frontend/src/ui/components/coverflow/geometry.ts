// CoverFlow layout math — the 3D fan transform and the windowing/easing
// constants behind the carousel. Pure and framework-free so the geometry is
// testable and the card stays declarative.

export const COVER = 280; // cover edge length (px)
// Only the center ±4 are ever visible (op:0 beyond) — 9 cards in a gentle fan —
// so mount a ±6 window (2-card margin → entering cards mount invisibly, then
// fade in as they cross into ±4). The carousel's analogue of virtualization.
export const COVER_WINDOW = 6;
// Progress dots are cheap but N of them overflow the bar and waste transitions
// at scale; window them too. Small lists (≤ 2*win+1) still render every dot.
export const COVER_DOT_WINDOW = 20;

export const SCENE_EASE = [0.16, 1, 0.3, 1] as const; // scene y/scale on expand
export const CARD_EASE = [0.2, 0.7, 0.2, 1] as const; // per-card fan tween
export const META_EASE = "cubic-bezier(.16,1,.3,1)"; // meta translate on expand

export type CoverTransform = {
  x: number;
  ry: number;
  tz: number;
  sc: number;
  z: number;
  op: number;
};

/**
 * Fan placement of a card at signed offset `off` from center (0 = centered).
 * Center pops toward the viewer; side cards get a gentle 39° tilt + wide spacing
 * so they read as cards, not edge-on slivers; ±4 stay visible (9 total).
 */
export function coverTransform(off: number): CoverTransform {
  const s = Math.sign(off),
    a = Math.abs(off);
  if (off === 0) return { x: 0, ry: 0, tz: 130, sc: 1, z: 300, op: 1 };
  return {
    x: s * (215 + (a - 1) * 84),
    ry: -s * 39,
    tz: -40 - a * 28,
    sc: 0.94,
    z: 250 - a,
    op: a > 4 ? 0 : 1,
  };
}
