/**
 * Motion tokens — the design system's easing vocabulary, in TypeScript.
 *
 * The curves live here rather than at each use site because the same one drives
 * effects that must land together: the page morph and the hero it flies into,
 * the cover-flow expand and the meta text that slides with it. Two of those
 * written a hair apart read as one animation tearing.
 *
 * The expo-out is exported in both shapes because it drives both kinds of
 * animation: a CSS `transition` needs the `cubic-bezier(...)` string, Motion
 * needs the four control points, and the two must never be able to disagree —
 * so the string is derived from the points.
 */

/** The signature ease: a hard expo-out. Used by every LARGE move — the
 *  cross-screen morph, sheets, cover-flow expansion, now-playing panels. */
export const EXPO_OUT = [0.16, 1, 0.3, 1] as const;
export const EXPO_OUT_CSS = `cubic-bezier(${EXPO_OUT.join(",")})`;

/** The micro-interaction ease: a softer settle for hover lifts and card fans,
 *  where an expo-out would read as an overshoot. The stylesheets spell this
 *  curve out inline for their own hover rules; this is its Motion form. */
export const SETTLE = [0.2, 0.7, 0.2, 1] as const;
