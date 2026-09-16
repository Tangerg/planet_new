import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import type { AnimationPlaybackControls } from "motion/react";

type MarqueeProps = {
  children: React.ReactNode;
  className?: string;
  speed?: number;
};

const GAP = 48;

export function Marquee({ children, className, speed = 40 }: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const reduce = useReducedMotion();
  const [single, setSingle] = useState(0);
  const [box, setBox] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const c = containerRef.current;
    const cp = copyRef.current;
    if (!c || !cp) return;
    const measure = () => {
      setSingle(cp.scrollWidth);
      setBox(c.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(c);
    ro.observe(cp);
    return () => ro.disconnect();
  }, []);

  const overflow = single > box + 1;
  const distance = single + GAP;

  useEffect(() => {
    if (reduce || !overflow) {
      x.set(0);
      anim.current = null;
      return;
    }
    const controls = animate(x, [0, -distance], {
      ease: "linear",
      duration: distance / speed,
      repeat: Infinity,
      repeatType: "loop",
    });
    anim.current = controls;
    return () => controls.stop();
  }, [overflow, distance, reduce, speed, x]);

  useEffect(() => {
    if (paused) anim.current?.pause();
    else anim.current?.play();
  }, [paused, overflow, distance, reduce]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ overflow: "hidden" }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <motion.div
        style={{
          x,
          display: "inline-flex",
          whiteSpace: "nowrap",
          willChange: overflow && !reduce ? "transform" : undefined,
        }}
      >
        <span ref={copyRef} style={{ flex: "0 0 auto" }}>
          {children}
        </span>
        {overflow && (
          <span aria-hidden style={{ flex: "0 0 auto", paddingLeft: GAP }}>
            {children}
          </span>
        )}
      </motion.div>
    </div>
  );
}
