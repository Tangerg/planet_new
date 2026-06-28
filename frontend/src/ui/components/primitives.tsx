// ============================================================
// Sonance Vibe — UI primitives: icons, art, formatting helpers
// Ported verbatim from example/music-player/vibe/core.jsx.
// Only adaptation: <Art> renders a real <img> cover when given an
// `image` URL (gradient art is the fallback / placeholder), replacing
// the mockup-only <image-slot> drag-drop web component.
// ============================================================
import React from "react";
import { motion, useReducedMotion } from "motion/react";

import { pickImageUrl, type Image } from "@domain/model/image";
import "./primitives.css";

/* ---- icons (hand-drawn, stroke-based) -------------------------------------
   Our own geometric SVG set — no icon-library dependency. `Icon.<name>` + the
   `{ size, filled }` signature feeds both static `<Icon.x/>` uses and the
   dynamic `Icon[name]` lookups in the XMB world tree / menus. Transport glyphs
   are PLAIN filled shapes (no surrounding circle — the round frame is the
   button). `shuffle` / `loop` use the industry-standard crossing-arrows /
   repeat geometry (lucide's Shuffle / Repeat paths) — the hand-rolled originals
   read poorly, and this is the shape players converge on. */
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
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    {children}
  </svg>
);

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
      <path d="m18 14 4 4-4 4" />
      <path d="m18 2 4 4-4 4" />
      <path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" />
      <path d="M2 6h1.972a4 4 0 0 1 3.6 2.2" />
      <path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" />
    </Svg>
  ),
  loop: (p) => (
    <Svg {...p}>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
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
  comment: (p) => (
    <Svg {...p}>
      <path d="M4 5h16v11H9l-4 3.5V16H4z" />
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
  volume: (p) => (
    <Svg {...p}>
      <path d="M5 9v6h4l5 4V5L9 9zM17 8a5 5 0 0 1 0 8" />
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
      <path d="M4 7h11M4 12h11M4 17h7M18 14v6M18 14l3 2" />
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

/* animated equalizer mark (top-right tool in references) */
export function Equalizer({
  playing = true,
  color = "currentColor",
  size = 18,
}: {
  playing?: boolean;
  color?: string;
  size?: number;
}) {
  const bars = [0, 1, 2, 3];
  return (
    <span className="inline-flex items-end gap-0.5" style={{ height: size, width: size }}>
      {bars.map((i) => (
        // Full-height bar scaled from the bottom — scaleY is GPU-composited, so it
        // doesn't thrash layout the way the old `height` keyframe did.
        <motion.span
          key={i}
          className="h-full w-[2.5px] origin-bottom rounded-[2px]"
          style={{ background: color }}
          initial={false}
          animate={playing ? { scaleY: [0.3, 1, 0.3] } : { scaleY: 0.4 }}
          transition={
            playing
              ? { duration: 1, ease: "easeInOut", repeat: Infinity, delay: i * 0.18 }
              : { duration: 0.2 }
          }
        />
      ))}
    </span>
  );
}

/* ---- generative cover art (copyright-safe, editorial) ---- */
const ART_PAIRS: [string, string][] = [
  ["#1b1033", "#ff2188"],
  ["#06222b", "#19d3c5"],
  ["#2a0716", "#ff5a3c"],
  ["#0b1b3a", "#5b8cff"],
  ["#241003", "#ffb02e"],
  ["#13031f", "#b15cff"],
  ["#031a12", "#1ed98a"],
  ["#2a0420", "#ff4fa3"],
  ["#101012", "#8aa0b5"],
  ["#1a0524", "#ff7ad9"],
  ["#021e24", "#36c5e0"],
  ["#240b04", "#ff8a3c"],
];

export function artPair(seed = 0, grad?: string[]): [string, string] {
  if (grad && grad.length === 2) return [grad[0], grad[1]];
  return ART_PAIRS[((seed % ART_PAIRS.length) + ART_PAIRS.length) % ART_PAIRS.length];
}

export function artBg(seed = 0, grad?: string[]): string {
  const [a, b] = artPair(seed, grad);
  const ax = 18 + ((seed * 13) % 50),
    ay = 12 + ((seed * 29) % 40);
  const bx = 60 + ((seed * 17) % 35),
    by = 60 + ((seed * 23) % 35);
  return (
    `radial-gradient(80% 70% at ${ax}% ${ay}%, ${b}cc 0%, transparent 55%),` +
    `radial-gradient(90% 80% at ${bx}% ${by}%, ${a} 0%, transparent 60%),` +
    `linear-gradient(140deg, ${a} 0%, ${b} 130%)`
  );
}

/* Art surface: gradient + grain. Renders a real cover <img> when an
   `image` URL is given (gradient stays behind as fallback / while loading). */
export type ArtProps = React.HTMLAttributes<HTMLDivElement> & {
  seed?: number;
  grad?: string[];
  image?: string;
  /** Size variants (largest-first). When given, the one matching this box's
   *  render width is chosen — small thumbs fetch small files, heroes large. */
  images?: Image[];
  /** Render width in CSS px for image selection, when the box is sized by a CSS
   *  class rather than an inline numeric width (cards, tiles). */
  px?: number;
  mono?: boolean;
  glow?: string;
  /** Film-grain overlay (the `.grain::before` mix-blend layer). Default on; turn
   *  OFF for fast-animating surfaces (e.g. CoverFlow) where ~N moving mix-blend
   *  layers re-blend against the backdrop every frame and drop frames. */
  grain?: boolean;
};

export function Art({
  seed = 0,
  grad,
  image,
  images,
  px,
  mono = false,
  grain = true,
  className = "",
  style = {},
  children,
  glow,
  ...rest
}: ArtProps) {
  const bg = artBg(seed, grad);
  // Resolve the cover: pick the variant matching this box. The render width is
  // `px` (for CSS-sized boxes) or an inline numeric style.width; scale by DPR
  // (capped at 2) so retina is crisp without over-fetching. Unknown width
  // (%/full-bleed) takes the largest.
  const dpr = typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1;
  const renderW = px ?? (typeof style.width === "number" ? style.width : undefined);
  const target = renderW != null ? renderW * dpr : "large";
  const src = images && images.length ? pickImageUrl(images, target) : image;
  return (
    <div
      className={(grain ? "grain " : "") + className}
      {...rest}
      // position/overflow stay INLINE (not utilities) so a consumer can flip
      // position to absolute via its own style spread (e.g. full-bleed bg / hero
      // covers) — a `position` utility here would tie with the consumer's and the
      // winner would hinge on Tailwind's emission order.
      style={{ position: "relative", overflow: "hidden", background: bg, ...style }}
    >
      {src && (
        <img
          src={src}
          alt=""
          draggable={false}
          // Defer off-screen covers and decode off the main thread — covers in
          // long lists/grids no longer load+decode all at once. In-viewport art
          // (heroes, the morph tile) still loads immediately, so transitions and
          // the gradient→image fill are unaffected.
          loading="lazy"
          decoding="async"
          className="absolute inset-0 z-0 h-full w-full object-cover"
          style={{ filter: mono ? "grayscale(1) contrast(1.05)" : "none" }}
        />
      )}
      {/* "stage-light" glow is for the GRADIENT placeholder only. Over a real
         cover it tints the photo (a coloured film that reads as haze), so skip
         it once an image is present. */}
      {glow && !src && (
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background: `radial-gradient(45% 45% at 50% 50%, ${glow}55 0%, transparent 70%)`,
          }}
        />
      )}
      <div className="relative z-[3] h-full">{children}</div>
    </div>
  );
}

/**
 * Full-page background derived from a hero cover: a heavily-blurred copy of the
 * artwork supplies the real hue, and a top→bottom gradient darkens it into the
 * base across the WHOLE height (Spotify-like, but not just the top band). Render
 * it as the first child of a `position: relative` page wrapper, with the
 * scrolling content above it. Falls back to the seeded gradient with no cover.
 *
 * Atmosphere comes from sampling only a SMALL region of the artwork: the image
 * is scaled up hard (~2.4×) so cover-crop keeps just the centre. Blur is kept
 * moderate ON PURPOSE — too much (>60px) averages every hue into one flat wash
 * ("the whole page is one colour"); a lighter blur preserves the image's colour
 * structure so a vivid cover reads as real variation across the page, while
 * still abstracting any face into soft shapes. Opacity + saturation are pushed
 * so it actually reads; the scrim stays light at the top (colour breathes behind
 * the hero) and resolves to the solid base by the bottom for content legibility.
 */
export function HeroBackdrop({
  image,
  seed = 0,
  grad,
  scrim = "linear-gradient(180deg, rgba(10,10,13,.18) 0%, rgba(10,10,13,.58) 46%, #0a0a0d 90%)",
}: {
  image?: string;
  seed?: number;
  grad?: string[];
  /** Top→bottom overlay; override to tune how far the colour reaches. */
  scrim?: string;
}) {
  // Two layers sample different regions of the same cover and drift in opposite
  // directions (Motion) so the hues slowly cross — a living ambient wash, not a
  // flat smear. The heavy blur / opacity / object-position stay static in CSS
  // (.herobg*); only the GPU-composited transform animates. Reduced-motion holds
  // each layer at a fixed scale (no drift).
  const reduce = useReducedMotion();
  const layer = (which: "a" | "b") => {
    const cls = `herobg-layer herobg-${which}`;
    const animate = reduce
      ? { scale: which === "a" ? 1.6 : 1.65 }
      : which === "a"
        ? { scale: [1.5, 1.7], x: ["-8%", "8%"], y: ["-5%", "6%"] }
        : { scale: [1.6, 1.7], x: ["8%", "-8%"], y: ["5%", "-6%"], rotate: [0, 2] };
    const transition = reduce
      ? undefined
      : ({
          duration: which === "a" ? 10 : 15,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "mirror",
        } as const);
    return image ? (
      <motion.img
        src={image}
        alt=""
        aria-hidden
        className={cls}
        animate={animate}
        transition={transition}
      />
    ) : (
      <motion.div
        aria-hidden
        className={cls}
        style={{ background: artBg(seed, grad) }}
        animate={animate}
        transition={transition}
      />
    );
  };
  return (
    <>
      <div className="herobg" aria-hidden>
        {layer("a")}
        {layer("b")}
        <div className="herobg-grain" />
      </div>
      <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: scrim }} />
    </>
  );
}

export function fmt(sec: number): string {
  sec = Math.max(0, Math.floor(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
