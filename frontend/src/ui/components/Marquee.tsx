// ============================================================
// Marquee — a single-line strip that, ONLY when its content overflows, scrolls
// it leftward in a seamless one-way loop (the content exits left while a second
// copy enters from the right, repeating) — not a left-right sway. Used for
// now-playing title / artist so a long name reads instead of dead-truncating.
// Pauses on hover (resuming from where it froze) so the clickable artist links
// underneath stay clickable; holds still under prefers-reduced-motion.
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import type { AnimationPlaybackControls } from "motion/react";

type MarqueeProps = {
  children: React.ReactNode;
  /** Outer classes — put the text size/weight/colour here; the strip inherits. */
  className?: string;
  /** Scroll speed in px/sec (default 40). */
  speed?: number;
};

// Breathing room between the looping copies, so it reads as a repeat, not a smear.
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

  // Measure one copy's width vs the box; a ResizeObserver re-measures on content
  // changes (new track) and container resizes (window).
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
  const distance = single + GAP; // one full loop translates by exactly this

  // Drive the loop. Translating by `distance` lands the second copy precisely
  // where the first began, so the repeat snap (loop) is visually seamless.
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

  // Pause/resume in place on hover (re-applied after the loop is (re)built).
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
          // Only hint a layer while the loop is actually running. A short title
          // never scrolls, and every player-bar/now-playing title holding a
          // permanent compositor layer is pure GPU memory for no motion.
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
