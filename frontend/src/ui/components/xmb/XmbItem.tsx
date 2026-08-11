import React, { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useTranslation } from "react-i18next";

import { localize } from "@/i18n/text";
import { artBg } from "@/components/primitives";
import { FadeIn } from "@/components/motion";
import { Icon } from "@/infra/icons";
import type { XmbItemModel } from "@/model/navigation";
import { xmbItemVisualState } from "@/model/xmb-item";

import { XMB_EASE } from "./geometry";

export function XmbItem({ item, active, o }: { item: XmbItemModel; active: boolean; o: number }) {
  const { t } = useTranslation();
  const visual = xmbItemVisualState(active, o);
  // Rack-focus depth, but only on the immediate ±1 neighbours (further rows are
  // already faded near-invisible by `op`, so blurring them buys nothing). A FIXED
  // radius with NO filter transition — on its own compositing layer — is the whole
  // point: tweening blur re-runs the convolution every frame (the XMB-scroll jank),
  // whereas snapping it once per move and caching the layer keeps the look cheap.
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
        gap: visual.gap,
        opacity: visual.opacity,
        ...(visual.nearBlur ? { filter: "blur(1.1px)", willChange: "filter" } : null),
        transition: `opacity .38s ${XMB_EASE}`,
      }}
    >
      <div className="relative z-[1] grid w-[60px] flex-none place-items-center">
        <motion.div
          data-art="1"
          data-xmb-active-art={active ? "1" : undefined}
          style={{
            width: visual.iconSize,
            height: visual.iconSize,
            borderRadius: visual.iconRadius,
            background: artBg(item.seed, item.grad),
            boxShadow: visual.iconShadow === "active" ? artShadow : "0 4px 12px rgba(0,0,0,.4)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            // box-shadow is Motion-driven (artShadow); transition the morphing
            // box props only so the CSS transition doesn't fight per-frame writes.
            transition: `width .38s ${XMB_EASE}, height .38s ${XMB_EASE}, border-radius .38s ${XMB_EASE}`,
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
            React.createElement(Icon[item.icon], { size: active ? 20 : 15, filled: true })}
        </motion.div>
      </div>
      <div className="relative z-[1] min-w-0">
        <div
          style={{
            fontSize: visual.titleFontSize,
            fontWeight: 300,
            letterSpacing: visual.titleLetterSpacing,
            lineHeight: 1.1,
            color: visual.titleColor,
            // Only these four differ between active/inactive; enumerated (not
            // `all`) so the browser doesn't diff every property each frame.
            transition: `font-size .38s ${XMB_EASE}, letter-spacing .38s ${XMB_EASE}, color .38s ${XMB_EASE}, max-width .38s ${XMB_EASE}`,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            // The selected item is the focus and owns the whole bar's width, so
            // give it a far larger cap: at 27px a shared 340px cap truncated it
            // EARLIER than the 18px candidates, hiding text on selection. Widen
            // it so selecting reveals more of the title, never less.
            maxWidth: visual.titleMaxWidth,
          }}
        >
          {localize(t, item.label)}
        </div>
        {active && (
          <FadeIn
            className="mt-2.5 h-0.5 w-[42px] rounded-[2px] bg-accent"
            style={{ boxShadow: "0 0 12px -1px var(--accent)" }}
          />
        )}
        {active && item.sub && (
          <FadeIn className="mlabel mt-[9px] max-w-[600px] truncate text-[10.5px] text-white/[0.55]">
            {localize(t, item.sub)}
          </FadeIn>
        )}
      </div>
    </div>
  );
}
