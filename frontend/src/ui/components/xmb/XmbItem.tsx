import React, { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

import { artBg } from "@/components/primitives";
import { FadeIn } from "@/components/motion";
import { Icon } from "@/infra/icons";
import type { XmbItemModel } from "@/model/navigation";

import { XMB_EASE } from "./geometry";

export function XmbItem({ item, active, o }: { item: XmbItemModel; active: boolean; o: number }) {
  // one vertical column: passed items rise above the bar, upcoming sink below
  const ad = Math.abs(o),
    above = o < 0;
  const op = active ? 1 : Math.max(0.14, (above ? 0.4 : 0.54) - 0.13 * ad);
  const blur = active ? 0 : Math.min(2.6, 0.55 * ad);
  const iconSz = active ? 52 : 30;
  // Breathing glow on the active art — same accent-var box-shadow trick as
  // XmbCategory (template a 0→1→0 value so only the numbers tween).
  const glow = useMotionValue(0);
  useEffect(() => {
    if (!active) return;
    const controls = animate(glow, [0, 1, 0], {
      duration: 3.2,
      ease: "easeInOut",
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [active, glow]);
  const artShadow = useTransform(
    glow,
    (v) =>
      `0 ${(12 + v * 2).toFixed(1)}px ${(30 + v * 4).toFixed(1)}px rgba(0,0,0,${(0.5 + v * 0.05).toFixed(3)}), 0 0 ${(26 + v * 24).toFixed(1)}px ${(-10 + v * 4).toFixed(1)}px var(--accent)`,
  );
  return (
    <div
      className="relative flex items-center"
      style={{
        gap: active ? 22 : 18,
        filter: `blur(${blur}px)`,
        opacity: op,
        transition: `opacity .55s ${XMB_EASE}, filter .55s ease`,
      }}
    >
      <div className="relative z-[1] grid w-[60px] flex-none place-items-center">
        <motion.div
          data-art="1"
          data-xmb-active-art={active ? "1" : undefined}
          style={{
            width: iconSz,
            height: iconSz,
            borderRadius: active ? 12 : 8,
            background: artBg(item.seed, item.grad),
            boxShadow: active ? artShadow : "0 4px 12px rgba(0,0,0,.4)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            // box-shadow is Motion-driven (artShadow); transition the morphing
            // box props only so the CSS transition doesn't fight per-frame writes.
            transition: `width .55s ${XMB_EASE}, height .55s ${XMB_EASE}, border-radius .55s ${XMB_EASE}`,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {item.image && (
            <img
              src={item.image}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {item.icon &&
            !item.image &&
            (Icon[item.icon]
              ? React.createElement(Icon[item.icon], { size: active ? 20 : 15, filled: true })
              : null)}
        </motion.div>
      </div>
      <div className="relative z-[1] min-w-0">
        <div
          style={{
            fontSize: active ? 27 : 18,
            fontWeight: 300,
            letterSpacing: active ? ".02em" : ".005em",
            lineHeight: 1.1,
            color: active ? "#fff" : "rgba(255,255,255,.8)",
            // Only these four differ between active/inactive; enumerated (not
            // `all`) so the browser doesn't diff every property each frame.
            transition: `font-size .55s ${XMB_EASE}, letter-spacing .55s ${XMB_EASE}, color .55s ${XMB_EASE}, max-width .55s ${XMB_EASE}`,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            // The selected item is the focus and owns the whole bar's width, so
            // give it a far larger cap: at 27px a shared 340px cap truncated it
            // EARLIER than the 18px candidates, hiding text on selection. Widen
            // it so selecting reveals more of the title, never less.
            maxWidth: active ? 600 : 340,
          }}
        >
          {item.label}
        </div>
        {active && (
          <FadeIn
            className="mt-2.5 h-0.5 w-[42px] rounded-[2px] bg-accent"
            style={{ boxShadow: "0 0 12px -1px var(--accent)" }}
          />
        )}
        {active && item.sub && (
          <FadeIn className="mlabel mt-[9px] max-w-[600px] truncate text-[10.5px] text-white/[0.55]">
            {item.sub}
          </FadeIn>
        )}
      </div>
    </div>
  );
}
