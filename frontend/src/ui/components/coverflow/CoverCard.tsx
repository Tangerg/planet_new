import type React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { Art, artBg, CoverFill } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { PressTarget } from "@/components/controls/PressTarget";
import { Icon } from "@/infra/icons";
import type { FlowItem } from "@/model/derive";

import { SETTLE } from "@/styles/motion";
import type { CoverTransform } from "./geometry";
import { useAccent } from "@/hooks/accent";

export function CoverCard({
  item,
  isCenter,
  cover,
  round,
  showPlay,
  transform,
  onActivate,
  onDoubleOpen,
  onContextMenu,
  onPlay,
}: {
  item: FlowItem;
  isCenter: boolean;
  cover: number;
  round?: boolean;
  showPlay: boolean;
  transform: CoverTransform;
  onActivate: () => void;
  onDoubleOpen?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onPlay: () => void;
}) {
  const accent = useAccent();
  const { t } = useTranslation();
  const o = transform;
  return (
    <motion.div
      onDoubleClick={onDoubleOpen}
      onContextMenu={onContextMenu}
      initial={false}
      animate={{ x: o.x, z: o.tz, rotateY: o.ry, scale: o.sc, opacity: o.op }}
      transition={{ duration: 0.32, ease: SETTLE }}
      style={{
        position: "absolute",
        left: -cover / 2,
        top: -cover / 2,
        width: cover,
        height: cover,
        zIndex: o.z,
        cursor: "pointer",
        pointerEvents: o.op ? "auto" : "none",
      }}
    >
      <div className="relative" style={{ width: cover, height: cover }}>
        <PressTarget label={item.name} onActivate={onActivate}>
          <Art
            seed={item.seed}
            grad={item.grad}
            image={item.image}
            images={item.images}
            grain={false}
            style={{
              width: cover,
              height: cover,
              borderRadius: round ? "50%" : undefined,
              boxShadow: isCenter
                ? `0 30px 70px -10px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.08)`
                : "0 20px 50px -16px rgba(0,0,0,.7)",
            }}
          />
        </PressTarget>
        {showPlay && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            aria-label={t("a11y.playItem", { name: item.name })}
            className="absolute z-[5] grid h-[52px] w-[52px] place-items-center rounded-full"
            style={{
              right: round ? 30 : 16,
              bottom: round ? 30 : 16,
              background: accent,
              color: "#06060a",
              boxShadow: `0 10px 26px -6px ${accent}`,
            }}
          >
            <Icon.play size={20} />
          </Button>
        )}
      </div>
      <div
        aria-hidden
        style={{
          width: cover,
          height: cover,
          marginTop: 2,
          borderRadius: round ? "50%" : undefined,
          background: artBg(item.seed, item.grad),
          transform: "scaleY(-1)",
          transformOrigin: "center",
          overflow: "hidden",
          WebkitMaskImage:
            "linear-gradient(to top, rgba(0,0,0,.62) 0%, rgba(0,0,0,.14) 30%, transparent 55%)",
          maskImage:
            "linear-gradient(to top, rgba(0,0,0,.62) 0%, rgba(0,0,0,.14) 30%, transparent 55%)",
          opacity: isCenter ? 0.5 : 0.32,
          transition: "opacity .32s",
        }}
      >
        <CoverFill src={item.image} />
      </div>
    </motion.div>
  );
}
