import { AnimatePresence, motion } from "motion/react";
import type { ComponentProps } from "react";

import { PlayerBar } from "@/components/PlayerBar";
import { EXPO_OUT } from "@/styles/motion";

type Props = { show: boolean } & ComponentProps<typeof PlayerBar>;

export function ShellPlayerDock({ show, ...bar }: Props) {
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
