// ============================================================
// Icon set — the app's own hand-drawn, stroke-based glyphs (no icon-library
// dependency). One library, one place to tune the shared config: stroke weight,
// line caps, the default size, and the fill convention all live in `Svg` below,
// so restyling every icon (e.g. a thicker stroke) is a one-line change here.
//
// `Icon.<name>` + the `{ size, filled }` signature feeds both static
// `<Icon.x/>` uses and the dynamic `Icon[name]` lookups in the XMB world tree /
// menus. Transport glyphs are PLAIN filled shapes (no surrounding circle — the
// round frame is the button, not the icon). `shuffle` / `loop` use the
// industry-standard crossing-arrows / repeat geometry players converge on.
//
// Add new icons here (keep the 24×24 viewBox + `<Svg>` wrapper) so the whole UI
// stays visually consistent.
// ============================================================
import React from "react";

/** Shared stroke weight for every outline glyph — tune once to restyle the set. */
const STROKE_WIDTH = 1.6;

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
  /** Selects the filled variant — only meaningful for icons that have one (heart). */
  filled?: boolean;
};

const Svg: React.FC<IconProps> = ({
  size = 22,
  children,
  fill = "none",
  filled: _filled,
  ...p
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={STROKE_WIDTH}
    // Set aesthetic: crisp/angular corners (miter joins → 有棱有角) but soft line
    // ends (round caps) — "sharp with a touch of round", not hard-edged. Acute
    // joins are clamped to a bevel by miterlimit so nothing spikes.
    strokeLinecap="round"
    strokeLinejoin="miter"
    strokeMiterlimit={2.6}
    {...p}
  >
    {children}
  </svg>
);

/** Render `children` scaled about the 24-box centre while holding the visual
 *  stroke at STROKE_WIDTH — lets a few glyphs whose natural extent runs large
 *  (the box-filling lucide shuffle/repeat) or small be optically size-matched to
 *  the rest WITHOUT changing their stroke weight. */
function scaled(factor: number, children: React.ReactNode) {
  return (
    <g
      transform={`translate(12 12) scale(${factor}) translate(-12 -12)`}
      strokeWidth={STROKE_WIDTH / factor}
    >
      {children}
    </g>
  );
}

export const Icon: Record<string, React.FC<IconProps>> = {
  // transport — plain filled shapes (no surrounding circle)
  play: (p) => (
    <Svg {...p} fill="currentColor" stroke="none">
      <path d="M8 5.5v13l11-6.5z" />
    </Svg>
  ),
  pause: (p) => (
    <Svg {...p} fill="currentColor" stroke="none">
      <rect x="6.5" y="5.5" width="3.4" height="13" rx="1" />
      <rect x="14.1" y="5.5" width="3.4" height="13" rx="1" />
    </Svg>
  ),
  prev: (p) => (
    <Svg {...p} fill="currentColor" stroke="none">
      <path d="M11 12 19 6v12zM5 6h2v12H5z" />
    </Svg>
  ),
  next: (p) => (
    <Svg {...p} fill="currentColor" stroke="none">
      <path d="M13 12 5 18V6zM17 6h2v12h-2z" />
    </Svg>
  ),
  // shuffle / loop — industry-standard geometry (lucide Shuffle / Repeat)
  shuffle: (p) => (
    <Svg {...p}>
      {scaled(
        0.88,
        <>
          <path d="m18 14 4 4-4 4" />
          <path d="m18 2 4 4-4 4" />
          <path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" />
          <path d="M2 6h1.972a4 4 0 0 1 3.6 2.2" />
          <path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" />
        </>,
      )}
    </Svg>
  ),
  loop: (p) => (
    <Svg {...p}>
      {scaled(
        0.88,
        <>
          <path d="m17 2 4 4-4 4" />
          <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
          <path d="m7 22-4-4 4-4" />
          <path d="M21 13v1a4 4 0 0 1-4 4H3" />
        </>,
      )}
    </Svg>
  ),
  infinity: (p) => (
    <Svg {...p}>
      <path d="M8.5 9.5a3 3 0 1 0 0 5c1.5 0 2.5-1.2 3.5-2.5s2-2.5 3.5-2.5a3 3 0 1 1 0 5c-1.5 0-2.5-1.2-3.5-2.5" />
    </Svg>
  ),
  // chrome / library
  heart: ({ filled, ...p }) => (
    <Svg {...p}>
      <path
        d="M12 20.3l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.49z"
        fill={filled ? "currentColor" : "none"}
      />
    </Svg>
  ),
  // crisp speech bubble — small-radius corners + a sharp tail (angular, with just
  // a hint of round on the corners).
  comment: (p) => (
    <Svg {...p}>
      <path d="M4.5 5h15a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-9l-4 3v-3H4.5A1.5 1.5 0 0 1 3 14.5v-8A1.5 1.5 0 0 1 4.5 5z" />
    </Svg>
  ),
  // lyrics — a vocal microphone (the convention for a sing-along / lyrics view);
  // a clean stand-mic with our own proportions, not any one product's exact glyph.
  lyrics: (p) => (
    <Svg {...p}>
      <rect x="9" y="2" width="6" height="11" rx="2" />
      <path d="M6 11.5a6 6 0 0 0 12 0" />
      <path d="M12 17.5V21" />
      <path d="M9 21h6" />
    </Svg>
  ),
  search: (p) => (
    <Svg {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </Svg>
  ),
  close: (p) => (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  ),
  back: (p) => (
    <Svg {...p}>
      <path d="M15 5l-7 7 7 7" />
    </Svg>
  ),
  kebab: (p) => (
    <Svg {...p} fill="currentColor" stroke="none">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </Svg>
  ),
  check: (p) => (
    <Svg {...p}>
      <path d="M5 12.5 10 17l9-10" />
    </Svg>
  ),
  // speaker + two curved waves (Spotify-style "volume high"); fills the box on
  // its own, so no scale hack needed.
  volume: (p) => (
    <Svg {...p}>
      <path d="M4 9.5v5h3.5l5 4V5.5L7.5 9.5z" />
      <path d="M15.5 9.5a4 4 0 0 1 0 5" />
      <path d="M18 7a8 8 0 0 1 0 10" />
    </Svg>
  ),
  note: (p) => (
    <Svg {...p}>
      <path d="M9 18V5l10-2v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="15" r="3" />
    </Svg>
  ),
  // view toggles
  list: (p) => (
    <Svg {...p}>
      <path d="M4 5h12M4 12h12M4 19h7M18 14v6M18 14l3 2" />
    </Svg>
  ),
  grid: (p) => (
    <Svg {...p}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
      <circle cx="17" cy="17" r="3.6" />
    </Svg>
  ),
  flow: (p) => (
    <Svg {...p}>
      <rect x="2.5" y="8" width="4" height="8" rx="1" />
      <rect x="9" y="4.5" width="6" height="15" rx="1.2" />
      <rect x="17.5" y="8" width="4" height="8" rx="1" />
    </Svg>
  ),
  // XMB worlds
  star: (p) => (
    <Svg {...p}>
      <path
        d="M12 3c.45 4.6 1.95 6.1 6.5 6.5-4.55.4-6.05 1.9-6.5 6.5-.45-4.6-1.95-6.1-6.5-6.5C10.05 9.1 11.55 7.6 12 3z"
        fill="currentColor"
        stroke="none"
      />
    </Svg>
  ),
  bars: (p) => (
    <Svg {...p} fill="currentColor" stroke="none">
      <rect x="4" y="11" width="3.4" height="9" rx="1" />
      <rect x="10.3" y="5" width="3.4" height="15" rx="1" />
      <rect x="16.6" y="8" width="3.4" height="12" rx="1" />
    </Svg>
  ),
  clock: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Svg>
  ),
  compass: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.6 8.4l-2.3 4.9-4.9 2.3 2.3-4.9z" fill="currentColor" stroke="none" />
    </Svg>
  ),
  stack: (p) => (
    <Svg {...p}>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </Svg>
  ),
  gear: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </Svg>
  ),
  user: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Svg>
  ),
};
