// ============================================================
// In-page entrance / content-swap motion — the Motion (motion/react) versions
// of the hand-written CSS keyframes (.fade-in / .rise / .xfade / .np-swap).
// Drop-in for the old `<div className="fade-in …">`: each renders a motion.div
// that forwards all div props (className/style/onClick/key/…), so the DOM shape
// is unchanged.
//
// Each reads useMorphFrozen(): on the outgoing morph layer the entrance must NOT
// replay (it would flash as the screen leaves), so it renders at its final state
// — the Motion equivalent of the old `.t-from * { animation: none }` freeze.
//
// Explicit initial/animate OBJECTS (not variant label strings) are used on
// purpose: variant labels propagate to motion children, which would make a
// nested <Rise> inherit a parent <FadeIn>'s timeline. Objects don't propagate.
// ============================================================
import { motion, type HTMLMotionProps } from "motion/react";
import { useMorphFrozen } from "@/infra/morph";

// CSS `ease` and the two ported bezier curves, kept verbatim from the keyframes.
const EASE_CSS = [0.25, 0.1, 0.25, 1] as const;
const EASE_RISE = [0.2, 0.7, 0.2, 1] as const;
const EASE_NP = [0.32, 0.72, 0, 1] as const;

type DivMotionProps = HTMLMotionProps<"div">;

/** Screen / section fade-in (was `.fade-in`). */
export function FadeIn({ children, ...rest }: DivMotionProps) {
  const frozen = useMorphFrozen();
  return (
    <motion.div
      initial={frozen ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE_CSS }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Element entrance — fade + travel up (was `.rise`). `delay` staggers a list. */
export function Rise({ children, delay = 0, ...rest }: DivMotionProps & { delay?: number }) {
  const frozen = useMorphFrozen();
  return (
    <motion.div
      initial={frozen ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE_RISE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Tab-panel cross-fade (was `.xfade`). Re-animates when its `key` changes. */
export function XFade({ children, ...rest }: DivMotionProps) {
  const frozen = useMorphFrozen();
  return (
    <motion.div
      initial={frozen ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: EASE_RISE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Now-Playing side-panel content swap, lyrics↔comments (was `.np-swap`). */
export function NpSwap({ children, ...rest }: DivMotionProps) {
  const frozen = useMorphFrozen();
  return (
    <motion.div
      initial={frozen ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE_NP }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
