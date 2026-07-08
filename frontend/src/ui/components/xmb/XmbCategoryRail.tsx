import { motion } from "motion/react";

import type { XmbCat } from "@/model/navigation";

import {
  XMB_ANCHOR,
  XMB_BAR_Y,
  XMB_CAT_GAP,
  XMB_EASE,
  XMB_EASE_ARR,
  categoryTransform,
} from "./geometry";
import { XmbCategory } from "./XmbCategory";

/**
 * The horizontal category axis: the active category is centred at the anchor,
 * neighbours arc away along a cosine curve. y + rotate ride Motion (compositor)
 * instead of animating `top` (layout) — same arc, no per-frame reflow.
 */
export function XmbCategoryRail({
  cats,
  c,
  onSelect,
}: {
  cats: XmbCat[];
  c: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div style={{ position: "absolute", left: XMB_ANCHOR, top: XMB_BAR_Y, zIndex: 9 }}>
      <div
        style={{
          transform: `translateX(${-c * XMB_CAT_GAP}px)`,
          transition: `transform .42s ${XMB_EASE}`,
        }}
      >
        {cats.map((cc, i) => {
          const { y, rotate } = categoryTransform(i, c);
          return (
            <motion.div
              key={cc.id}
              style={{ position: "absolute", left: i * XMB_CAT_GAP, top: 0 }}
              initial={false}
              animate={{ y, rotate }}
              transition={{ duration: 0.42, ease: XMB_EASE_ARR }}
            >
              <XmbCategory cat={cc} active={i === c} dim={0.3} onClick={() => onSelect(i)} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
