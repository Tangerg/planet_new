// ============================================================
// Grid-card hover lift — the "float up + scale, play fab rises from below"
// interaction for grid tiles (DOTA2-style). Driven by Motion (motion/react),
// our standard for IN-PAGE motion (page→page transitions are the morph engine).
//
// Why not CSS :hover: a transition can't express a real symmetric enter/leave
// timeline, can't tween z-index, and the rule fought `.mcard`'s in the cascade.
// `whileHover` gives the leave for free; variant propagation rises the fab with
// the card; `transitionEnd` drops the raised stacking only AFTER the leave
// settles (so the shrinking card never falls behind its neighbours mid-exit).
// ============================================================
import React from "react";
import { motion, type Variants } from "motion/react";
import { Button, type ButtonProps } from "@/components/controls/Button";
import { EXPO_OUT } from "@/styles/motion";

// Square cover cards lift hard (1.22); wider/compact shapes (rail cards, chart
// banners, genre tiles, quick rows) dial it down via the `scale`/`liftY` props
// so the float reads as a gentle pop, not a balloon. z-index can't tween, so the
// raised stacking is held through the WHOLE leave glide, then dropped (else the
// shrinking card sinks behind its neighbours mid-exit).
// Cached per (scale, liftY) pair: every card in a grid/rail shares one of a
// handful of tunings, and handing Motion a fresh `variants` object on each render
// makes it re-resolve the whole variant tree for every visible card on every
// windowing tick. There are only ever a few distinct pairs, so the cache is tiny.
const LIFT_VARIANTS = new Map<string, Variants>();

function liftVariants(scale: number, liftY: number): Variants {
  const key = `${scale}:${liftY}`;
  const cached = LIFT_VARIANTS.get(key);
  if (cached) return cached;
  const variants: Variants = {
    rest: {
      y: 0,
      scale: 1,
      transition: { duration: 0.26, ease: EXPO_OUT },
      transitionEnd: { zIndex: 0 },
    },
    hover: {
      y: liftY,
      scale,
      zIndex: 5,
      transition: { duration: 0.24, ease: EXPO_OUT },
    },
  };
  LIFT_VARIANTS.set(key, variants);
  return variants;
}

// fab rises from below as the card lifts (slight delay so it trails). Inherits
// the rest/hover label from the LiftCard parent via Motion variant propagation.
const fabVariants: Variants = {
  rest: { y: 16, opacity: 0, scale: 0.92, transition: { duration: 0.22, ease: EXPO_OUT } },
  hover: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.24, ease: EXPO_OUT, delay: 0.02 },
  },
};

export type LiftTuning = { scale?: number; liftY?: number };

/** The gentler pop for cards that are not full square covers — rail cards and
 *  the wrapping "similar artists" grid that used to be one. A named tuning
 *  rather than the pair written out at each card: seven surfaces share it, and
 *  a rail whose lift is 2% off its neighbour's reads as a bug, not a variant. */
export const RAIL_LIFT: LiftTuning = { scale: 1.12, liftY: -6 };

type LiftCardProps = React.ComponentPropsWithoutRef<typeof motion.div> & LiftTuning;

/** Grid tile that floats up + scales on hover; nested <RiseFab>s rise with it. */
export function LiftCard({ children, scale = 1.22, liftY = -8, ...rest }: LiftCardProps) {
  return (
    <motion.div variants={liftVariants(scale, liftY)} initial="rest" whileHover="hover" {...rest}>
      {children}
    </motion.div>
  );
}

const MotionButton = motion.create(Button);

// React's DOM drag/animation handlers collide with Motion's gesture handlers of
// the same name — drop them (we use neither here).
type MotionButtonProps = Omit<
  ButtonProps,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"
>;

/** Play fab inside a LiftCard — rises from below on the card's hover. */
export function RiseFab({ ref, style, ...props }: MotionButtonProps) {
  return (
    <MotionButton
      ref={ref}
      variants={fabVariants}
      whileTap={{ scale: 0.96 }}
      {...props}
      // Motion owns the rise (transform) + opacity + the tap press, so kill the
      // `.btn` `transition: transform 0.08s` — otherwise that CSS transition
      // double-animates Motion's per-frame transform writes and the fab snaps/
      // flashes as it settles at the end of the rise.
      style={{ ...style, transition: "none" }}
    />
  );
}

/** The lift on a real <button> (chart banners, genre tiles) — no fab to rise. */
export function LiftButton({
  scale = 1.08,
  liftY = -6,
  style,
  ...rest
}: MotionButtonProps & LiftTuning) {
  return (
    <MotionButton
      variants={liftVariants(scale, liftY)}
      initial="rest"
      whileHover="hover"
      // Motion owns the lift transform + the tap press, so kill the `.btn`
      // `transition: transform` — otherwise it double-animates Motion's per-frame
      // transform writes (a subtle smear/snap on the lift's settle).
      whileTap={{ scale: 0.96 }}
      {...rest}
      style={{ ...style, transition: "none" }}
    />
  );
}
