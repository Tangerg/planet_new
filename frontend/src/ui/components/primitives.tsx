// ============================================================
// Sonance Vibe — UI primitives: icons, art, formatting helpers
// Ported verbatim from example/music-player/vibe/core.jsx.
// Only adaptation: <Art> renders a real <img> cover when given an
// `image` URL (gradient art is the fallback / placeholder), replacing
// the mockup-only <image-slot> drag-drop web component.
// ============================================================
import React from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  BarChart3,
  Check,
  ChevronLeft,
  Clock,
  Compass,
  EllipsisVertical,
  GalleryHorizontalEnd,
  Heart,
  Infinity as InfinityIcon,
  Layers,
  LayoutGrid,
  List,
  type LucideIcon,
  MessageCircle,
  Music,
  Pause,
  Play,
  Repeat,
  Search,
  Settings,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  User,
  Volume2,
  X,
} from "lucide-react";

import { pickImageUrl, type Image } from "@domain/model/image";
import "./primitives.css";

/* ---- icons (lucide-react) -------------------------------------------------
   The icon set is lucide-react. The `Icon.<name>` facade + `{ size, filled }`
   call signature is kept (via adapt()) so every call site — including the
   dynamic `Icon[name]` lookups in the XMB world tree and the menus — stays
   untouched; only the glyphs change. Transport controls render PLAIN solid
   glyphs (Play / Pause / Skip*), never a circled variant (the round frame is the
   button, not the icon). lucide is stroke-based, so "solid" just fills the same
   path with currentColor. */
export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
  /** Selects the filled variant — only meaningful for icons that have one (heart). */
  filled?: boolean;
};

/** Adapt a lucide icon to the `Icon.<name>` facade. `solid` fills the glyph;
 *  a `fillToggle` icon fills only when the `filled` prop is set. */
function adapt(
  C: LucideIcon,
  opts: { solid?: boolean; fillToggle?: boolean } = {},
): React.FC<IconProps> {
  const Adapted: React.FC<IconProps> = ({ size = 22, filled, ...rest }) => {
    const solid = opts.fillToggle ? !!filled : !!opts.solid;
    return <C size={size} fill={solid ? "currentColor" : "none"} {...rest} />;
  };
  return Adapted;
}

export const Icon: Record<string, React.FC<IconProps>> = {
  // transport — plain solid glyphs, no surrounding circle
  play: adapt(Play, { solid: true }),
  pause: adapt(Pause, { solid: true }),
  prev: adapt(SkipBack, { solid: true }),
  next: adapt(SkipForward, { solid: true }),
  shuffle: adapt(Shuffle),
  loop: adapt(Repeat),
  infinity: adapt(InfinityIcon),
  // chrome / library
  heart: adapt(Heart, { fillToggle: true }),
  comment: adapt(MessageCircle),
  search: adapt(Search),
  close: adapt(X),
  back: adapt(ChevronLeft),
  kebab: adapt(EllipsisVertical, { solid: true }),
  check: adapt(Check),
  volume: adapt(Volume2),
  note: adapt(Music),
  // view toggles
  list: adapt(List),
  grid: adapt(LayoutGrid),
  flow: adapt(GalleryHorizontalEnd),
  // XMB worlds
  star: adapt(Sparkles, { solid: true }),
  bars: adapt(BarChart3),
  clock: adapt(Clock),
  compass: adapt(Compass),
  stack: adapt(Layers),
  gear: adapt(Settings),
  user: adapt(User),
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
