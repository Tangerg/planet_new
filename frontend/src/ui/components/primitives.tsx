import React from "react";
import { motion, useReducedMotion } from "motion/react";

import { pickImageUrl, type Image } from "@contexts/catalog";
import "./primitives.css";

const EQUALIZER_BARS = [0, 1, 2, 3];

export function Equalizer({
  playing = true,
  color = "currentColor",
  size = 18,
}: {
  playing?: boolean;
  color?: string;
  size?: number;
}) {
  return (
    <span className="inline-flex items-end gap-0.5" style={{ height: size, width: size }}>
      {EQUALIZER_BARS.map((i) => (
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

export function CoverFill({
  src,
  lazy = false,
  className = "",
}: {
  src?: string;
  lazy?: boolean;
  className?: string;
}) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      loading={lazy ? "lazy" : undefined}
      decoding="async"
      className={"absolute inset-0 h-full w-full object-cover " + className}
    />
  );
}

export type ArtProps = React.HTMLAttributes<HTMLDivElement> & {
  seed?: number;
  grad?: string[];
  image?: string;
  images?: Image[];
  px?: number;
  glow?: string;
  grain?: boolean;
};

export function Art({
  seed = 0,
  grad,
  image,
  images,
  px,
  grain = true,
  className = "",
  style = {},
  children,
  glow,
  ...rest
}: ArtProps) {
  const bg = artBg(seed, grad);
  const dpr = typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1;
  const renderW = px ?? (typeof style.width === "number" ? style.width : undefined);
  const target = renderW != null ? renderW * dpr : "large";
  const src = images && images.length ? pickImageUrl(images, target) : image;
  return (
    <div
      className={(grain ? "grain " : "") + className}
      {...rest}
      style={{ position: "relative", overflow: "hidden", background: bg, ...style }}
    >
      <CoverFill src={src} lazy className="z-0" />
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

export function HeroBackdrop({
  image,
  seed = 0,
  grad,
  scrim = "linear-gradient(180deg, rgba(10,10,13,.18) 0%, rgba(10,10,13,.58) 46%, #0a0a0d 90%)",
}: {
  image?: string;
  seed?: number;
  grad?: string[];
  scrim?: string;
}) {
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
        decoding="async"
        draggable={false}
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
