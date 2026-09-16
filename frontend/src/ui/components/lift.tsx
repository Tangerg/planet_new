import React from "react";
import { motion, type Variants } from "motion/react";
import { Button, type ButtonProps } from "@/components/controls/Button";
import { EXPO_OUT } from "@/styles/motion";

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

export const RAIL_LIFT: LiftTuning = { scale: 1.12, liftY: -6 };

type LiftCardProps = React.ComponentPropsWithoutRef<typeof motion.div> & LiftTuning;

export function LiftCard({ children, scale = 1.22, liftY = -8, ...rest }: LiftCardProps) {
  return (
    <motion.div variants={liftVariants(scale, liftY)} initial="rest" whileHover="hover" {...rest}>
      {children}
    </motion.div>
  );
}

const MotionButton = motion.create(Button);

type MotionButtonProps = Omit<
  ButtonProps,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"
>;

export function RiseFab({ ref, style, ...props }: MotionButtonProps) {
  return (
    <MotionButton
      ref={ref}
      variants={fabVariants}
      whileTap={{ scale: 0.96 }}
      {...props}
      style={{ ...style, transition: "none" }}
    />
  );
}

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
      whileTap={{ scale: 0.96 }}
      {...rest}
      style={{ ...style, transition: "none" }}
    />
  );
}
