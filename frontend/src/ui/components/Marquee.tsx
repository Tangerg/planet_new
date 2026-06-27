// ============================================================
// Marquee — a single-line text strip that gently scrolls horizontally ONLY when
// its content overflows, then sits still. Used for now-playing title / artist on
// the focused surfaces (player bar, Now Playing) so a long name is readable
// instead of dead-truncated. Pauses on hover so the (clickable) artist links
// underneath stay clickable, and holds still under prefers-reduced-motion.
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";

type MarqueeProps = {
  children: React.ReactNode;
  /** Outer classes — put the text size/weight/colour here; the strip inherits. */
  className?: string;
  /** Scroll speed in px/sec (default 40). */
  speed?: number;
  /** Hold (pause) at each end, seconds (default 1.4). */
  hold?: number;
};

export function Marquee({ children, className, speed = 40, hold = 1.4 }: MarqueeProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const reduce = useReducedMotion();
  const [overflow, setOverflow] = useState(0);
  const [paused, setPaused] = useState(false);

  // Track how far the content overruns its box; a ResizeObserver re-measures on
  // both content changes (new track) and container resizes (window).
  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const measure = () => setOverflow(Math.max(0, inner.scrollWidth - outer.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || overflow <= 0) {
      controls.set({ x: 0 });
      return;
    }
    if (paused) {
      // Freeze in place so a link currently in view stays clickable.
      controls.stop();
      return;
    }
    const scroll = overflow / speed; // seconds each direction
    const total = 2 * scroll + 2 * hold;
    void controls.start({
      x: [0, 0, -overflow, -overflow, 0],
      transition: {
        duration: total,
        // hold · scroll-out · hold · scroll-back
        times: [0, hold / total, (hold + scroll) / total, (2 * hold + scroll) / total, 1],
        ease: "linear",
        repeat: Infinity,
      },
    });
  }, [overflow, paused, reduce, speed, hold, controls]);

  return (
    <div
      ref={outerRef}
      className={className}
      style={{ overflow: "hidden" }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <motion.div
        ref={innerRef}
        animate={controls}
        style={{ display: "inline-block", whiteSpace: "nowrap", willChange: "transform" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
