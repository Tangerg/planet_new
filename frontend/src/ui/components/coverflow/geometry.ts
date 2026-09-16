export const COVER = 280;
export const COVER_WINDOW = 6;
export const COVER_DOT_WINDOW = 20;

export type CoverTransform = {
  x: number;
  ry: number;
  tz: number;
  sc: number;
  z: number;
  op: number;
};

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
