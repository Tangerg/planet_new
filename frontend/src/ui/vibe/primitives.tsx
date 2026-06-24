// ============================================================
// Sonance Vibe — UI primitives: icons, art, formatting helpers
// Ported from example/music-player/vibe/core.jsx.
// Icons now use lucide-react (third-party) instead of hand-written SVGs.
// <Art> renders a real <img> cover when given an `image` URL (gradient art
// is the fallback / placeholder), replacing the mockup-only <image-slot>.
// ============================================================
import React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  Clock,
  FastForward,
  Heart,
  MessageCircle,
  Shuffle,
  Repeat,
  Infinity as InfinityIcon,
  Search,
  X,
  EllipsisVertical,
  Download,
  ChevronLeft,
  Volume2,
  Music,
  LayoutGrid,
  Settings,
  BarChart3,
  ListMusic,
  Check,
  Grid3x3,
  GalleryThumbnails,
  User,
  Radio,
  Compass,
  Sparkles,
  type LucideProps,
} from "lucide-react";

/* ---- icons (lucide-react, stroke-based, matching the original vibe) ---- */
export type IconProps = LucideProps & {
  filled?: boolean;
};

/** Default stroke width to match the original hand-drawn vibe icons (1.6). */
const SW = { strokeWidth: 1.6 } as const;

/** Filled icon defaults: solid shape, no stroke. */
const FILLED = { fill: "currentColor", stroke: "none" } as const;

export const Icon: Record<string, React.FC<IconProps>> = {
  play: (p) => <Play {...SW} {...p} {...FILLED} />,
  pause: (p) => <Pause {...SW} {...p} {...FILLED} />,
  prev: (p) => <SkipBack {...SW} {...p} {...FILLED} />,
  next: (p) => <SkipForward {...SW} {...p} {...FILLED} />,
  rewind: (p) => <Rewind {...SW} {...p} {...FILLED} />,
  clock: (p) => <Clock {...SW} {...p} />,
  forward: (p) => <FastForward {...SW} {...p} {...FILLED} />,
  heart: ({ filled, ...p }) => <Heart {...SW} {...p} fill={filled ? "currentColor" : "none"} />,
  comment: (p) => <MessageCircle {...SW} {...p} />,
  shuffle: (p) => <Shuffle {...SW} {...p} />,
  loop: (p) => <Repeat {...SW} {...p} />,
  infinity: (p) => <InfinityIcon {...SW} {...p} />,
  search: (p) => <Search {...SW} {...p} />,
  close: (p) => <X {...SW} {...p} />,
  kebab: (p) => <EllipsisVertical {...SW} {...p} {...FILLED} />,
  download: (p) => <Download {...SW} {...p} />,
  back: (p) => <ChevronLeft {...SW} {...p} />,
  volume: (p) => <Volume2 {...SW} {...p} />,
  note: (p) => <Music {...SW} {...p} />,
  stack: (p) => <LayoutGrid {...SW} {...p} />,
  gear: (p) => <Settings {...SW} {...p} />,
  bars: (p) => <BarChart3 {...SW} {...p} {...FILLED} />,
  list: (p) => <ListMusic {...SW} {...p} />,
  check: (p) => <Check {...SW} {...p} />,
  grid: (p) => <Grid3x3 {...SW} {...p} />,
  flow: (p) => <GalleryThumbnails {...SW} {...p} />,
  user: (p) => <User {...SW} {...p} />,
  radio: (p) => <Radio {...SW} {...p} />,
  compass: (p) => <Compass {...SW} {...p} />,
  star: (p) => <Sparkles {...SW} {...p} {...FILLED} />,
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
    <span
      style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: size, width: size }}
    >
      {bars.map((i) => (
        <span
          key={i}
          style={{
            width: 2.5,
            background: color,
            borderRadius: 2,
            height: playing ? undefined : "40%",
            animation: playing ? `eqb 1s ${i * 0.18}s ease-in-out infinite` : "none",
          }}
        />
      ))}
      <style>{`@keyframes eqb{0%,100%{height:30%}50%{height:100%}}`}</style>
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
  mono?: boolean;
  glow?: string;
};

export function Art({
  seed = 0,
  grad,
  image,
  mono = false,
  className = "",
  style = {},
  children,
  glow,
  ...rest
}: ArtProps) {
  const bg = artBg(seed, grad);
  return (
    <div
      className={"grain " + className}
      {...rest}
      style={{ position: "relative", overflow: "hidden", background: bg, ...style }}
    >
      {image && (
        <img
          src={image}
          alt=""
          draggable={false}
          // Defer off-screen covers and decode off the main thread — covers in
          // long lists/grids no longer load+decode all at once. In-viewport art
          // (heroes, the morph tile) still loads immediately, so transitions and
          // the gradient→image fill are unaffected.
          loading="lazy"
          decoding="async"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: mono ? "grayscale(1) contrast(1.05)" : "none",
            zIndex: 0,
          }}
        />
      )}
      {glow && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            background: `radial-gradient(45% 45% at 50% 50%, ${glow}55 0%, transparent 70%)`,
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 3, height: "100%" }}>{children}</div>
    </div>
  );
}

export function fmt(sec: number): string {
  sec = Math.max(0, Math.floor(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
