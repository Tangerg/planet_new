import type React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { useMorphFrozen } from "@/infra/morph";
import { SETTLE } from "@/styles/motion";

const EASE_CSS = [0.22, 1, 0.36, 1] as const;
const EASE_NP = [0.32, 0.72, 0, 1] as const;

type DivMotionProps = HTMLMotionProps<"div"> & { ref?: React.Ref<HTMLDivElement> };

export function FadeIn({ ref, children, ...rest }: DivMotionProps) {
  const frozen = useMorphFrozen();
  return (
    <motion.div
      ref={ref}
      initial={frozen ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: EASE_CSS }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Rise({ ref, children, delay = 0, ...rest }: DivMotionProps & { delay?: number }) {
  const frozen = useMorphFrozen();
  return (
    <motion.div
      ref={ref}
      initial={frozen ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: SETTLE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function XFade({ ref, children, ...rest }: DivMotionProps) {
  const frozen = useMorphFrozen();
  return (
    <motion.div
      ref={ref}
      initial={frozen ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: SETTLE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function NpSwap({ ref, children, ...rest }: DivMotionProps) {
  const frozen = useMorphFrozen();
  return (
    <motion.div
      ref={ref}
      initial={frozen ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE_NP }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
