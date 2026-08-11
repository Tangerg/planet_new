import { AnimatePresence, motion } from "motion/react";
import type { ComponentProps } from "react";

import { PlayerBar } from "@/components/PlayerBar";
import { EXPO_OUT } from "@/styles/motion";

/**
 * The player bar's dock: it owns only whether the bar is on screen and how it
 * slides in and out. Everything else it hands straight through, so it takes the
 * bar's own props rather than restating them — a transport control added to the
 * bar reaches it without a second edit here, and the two lists cannot drift.
 */
type Props = { show: boolean } & ComponentProps<typeof PlayerBar>;

export function ShellPlayerDock({ show, ...bar }: Props) {
  // The frequent progress tick is subscribed one level deeper, inside the bar's
  // LiveScrubber leaf — so neither this dock (nor its Motion slide wrapper) nor
  // the memoized PlayerBar re-render several times a second as the clock advances.
  return (
    <>
      <div aria-hidden style={{ flex: `0 0 ${show ? 84 : 0}px` }} />

      <AnimatePresence initial={false}>
        {show && (
          <motion.div
            initial={{ y: "108%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "108%", opacity: 0 }}
            transition={{
              y: { duration: 0.32, ease: EXPO_OUT },
              opacity: { duration: 0.22 },
            }}
            className="absolute inset-x-0 bottom-0 z-30 overflow-visible will-change-transform"
            style={{ willChange: "transform, opacity" }}
          >
            <PlayerBar {...bar} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
