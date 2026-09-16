import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useAccent } from "@/hooks/accent";

const VIEW_W = 1280;
const VIEW_H = 736;

const paths = [
  { d: "M-200 380 C 200 240, 520 520, 900 360 S 1500 220, 1800 420", w: 1.6, o: 0.4, dur: 28 },
  { d: "M-200 440 C 260 360, 560 600, 920 440 S 1520 320, 1800 500", w: 1.1, o: 0.24, dur: 36 },
  { d: "M-200 320 C 240 460, 600 200, 940 380 S 1480 540, 1800 340", w: 0.8, o: 0.15, dur: 46 },
];

const pct = (units: number, extent: number) => `${(units / extent) * 100}%`;
const DRIFT_X = [pct(-30, VIEW_W), pct(30, VIEW_W)];
const DRIFT_Y = [pct(-8, VIEW_H), pct(10, VIEW_H)];

export function FlowWaves() {
  const accent = useAccent();
  const uid = useId();
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[2]">
      {paths.map((p, i) => {
        const gradientId = `${uid}-wave-${i}`;
        return (
          <motion.div
            key={i}
            className="absolute inset-0"
            animate={reduce ? undefined : { x: DRIFT_X, y: DRIFT_Y }}
            transition={
              reduce
                ? undefined
                : {
                    duration: p.dur,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "mirror",
                  }
            }
          >
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor={accent} stopOpacity="0" />
                  <stop offset=".5" stopColor={accent} stopOpacity="1" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={p.d}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={p.w}
                opacity={p.o}
              />
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
}
