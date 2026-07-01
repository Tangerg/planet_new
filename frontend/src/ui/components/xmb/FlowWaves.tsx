import { motion } from "motion/react";

// A few drifting bezier strokes — the signature XMB "wave".
const paths = [
  { d: "M-200 380 C 200 240, 520 520, 900 360 S 1500 220, 1800 420", w: 1.6, o: 0.4, dur: 28 },
  { d: "M-200 440 C 260 360, 560 600, 920 440 S 1520 320, 1800 500", w: 1.1, o: 0.24, dur: 36 },
  { d: "M-200 320 C 240 460, 600 200, 940 380 S 1480 540, 1800 340", w: 0.8, o: 0.15, dur: 46 },
];

export function FlowWaves({ accent }: { accent: string }) {
  return (
    <svg
      viewBox="0 0 1280 736"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
    >
      <defs>
        <linearGradient id="wv" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={accent} stopOpacity="0" />
          <stop offset=".5" stopColor={accent} stopOpacity="1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {paths.map((p, i) => (
        <motion.path
          key={i}
          d={p.d}
          fill="none"
          stroke="url(#wv)"
          strokeWidth={p.w}
          opacity={p.o}
          animate={{ x: [-30, 30], y: [-8, 10] }}
          transition={{
            duration: p.dur,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />
      ))}
    </svg>
  );
}
