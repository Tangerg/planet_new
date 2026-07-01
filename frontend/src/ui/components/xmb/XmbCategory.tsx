import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

import { Button } from "@/components/controls/Button";
import { Icon } from "@/infra/icons";
import type { XmbCat } from "@/model/navigation";

import { XMB_EASE } from "./geometry";

export function XmbCategory({
  cat,
  active,
  dim,
  onClick,
}: {
  cat: XmbCat;
  active: boolean;
  dim: number;
  onClick: () => void;
}) {
  const I = Icon[cat.icon] || Icon.note;
  const sz = active ? 92 : 58;
  // Breathing glow on the active icon. Motion can't interpolate a box-shadow
  // whose colour is `var(--accent)`, so drive a 0→1→0 value and template the
  // shadow from it — only the numbers tween, the accent var stays literal.
  const glow = useMotionValue(0);
  useEffect(() => {
    if (!active) return;
    const controls = animate(glow, [0, 1, 0], {
      duration: 3.4,
      ease: "easeInOut",
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [active, glow]);
  const catShadow = useTransform(
    glow,
    (v) =>
      `0 0 ${(44 + v * 26).toFixed(1)}px ${(-8 + v * 10).toFixed(1)}px var(--accent), 0 8px 24px rgba(0,0,0,.45)`,
  );
  return (
    <Button
      aria-label={cat.label}
      onClick={onClick}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: "translate(-50%,-50%)",
        background: "none",
        border: 0,
        cursor: "pointer",
        padding: 0,
        display: "grid",
        placeItems: "center",
        width: sz,
        height: sz,
        transition: `opacity .55s ${XMB_EASE}, width .55s ${XMB_EASE}, height .55s ${XMB_EASE}`,
        opacity: active ? 1 : dim,
      }}
    >
      <motion.span
        style={{
          width: sz,
          height: sz,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          color: active ? "#06060a" : "rgba(255,255,255,.85)",
          background: active ? "var(--accent)" : "rgba(16,16,22,.55)",
          border: active ? "none" : "1px solid rgba(255,255,255,.14)",
          backdropFilter: active ? "none" : "blur(6px)",
          boxShadow: active ? catShadow : "none",
          // box-shadow is Motion-driven (catShadow); transition the rest only, or
          // the CSS transition would fight the per-frame shadow updates.
          // backdrop-filter is deliberately NOT animated: tweening blur re-samples
          // and re-blurs the area behind every icon each frame (no GPU path) — the
          // frost just toggles, masked by the animated background/colour swap.
          transition: `width .55s ${XMB_EASE}, height .55s ${XMB_EASE}, color .55s ${XMB_EASE}, background .55s ${XMB_EASE}, border .55s ${XMB_EASE}`,
        }}
      >
        <I size={active ? 40 : 26} />
      </motion.span>
    </Button>
  );
}
