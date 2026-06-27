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

// the morph engine's ease — the lift glides on the same curve as the page
// transitions it sits beside.
const EASE = [0.16, 1, 0.3, 1] as const;

// Square cover cards lift hard (1.22); wider/compact shapes (rail cards, chart
// banners, genre tiles, quick rows) dial it down via the `scale`/`liftY` props
// so the float reads as a gentle pop, not a balloon. z-index can't tween, so the
// raised stacking is held through the WHOLE leave glide, then dropped (else the
// shrinking card sinks behind its neighbours mid-exit).
const liftVariants = (scale: number, liftY: number): Variants => ({
  rest: {
    y: 0,
    scale: 1,
    filter: "brightness(1)",
    transition: { duration: 0.5, ease: EASE },
    transitionEnd: { zIndex: 0 },
  },
  hover: {
    y: liftY,
    scale,
    filter: "brightness(1.08)",
    zIndex: 5,
    transition: { duration: 0.5, ease: EASE },
  },
});

// fab rises from below as the card lifts (slight delay so it trails). Inherits
// the rest/hover label from the LiftCard parent via Motion variant propagation.
const fabVariants: Variants = {
  rest: { y: 16, opacity: 0, scale: 0.92, transition: { duration: 0.4, ease: EASE } },
  hover: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.46, ease: EASE, delay: 0.05 } },
};

type LiftTuning = { scale?: number; liftY?: number };
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
export const RiseFab = React.forwardRef<HTMLButtonElement, MotionButtonProps>(function RiseFab(
  { style, ...props },
  ref,
) {
  return (
    <MotionButton
      ref={ref}
      variants={fabVariants}
      whileTap={{ scale: 0.9 }}
      {...props}
      // Motion owns the rise (transform) + opacity + the tap press, so kill the
      // `.btn` `transition: transform 0.08s` — otherwise that CSS transition
      // double-animates Motion's per-frame transform writes and the fab snaps/
      // flashes as it settles at the end of the rise.
      style={{ ...style, transition: "none" }}
    />
  );
});

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
