import type React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { Art, artBg } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { Icon } from "@/infra/icons";
import type { FlowItem } from "@/model/derive";
import { activateOnKey } from "@/lib/keys";

import { CARD_EASE, type CoverTransform } from "./geometry";

/**
 * One Cover Flow card: the fanned 3D surface (cover art + optional play fab) and
 * its classic floor reflection. The fan geometry (translate/rotateY/scale/opacity)
 * is Motion-driven and tweens as the carousel re-centers; `initial={false}` so
 * cards entering the windowed range snap to their fanned pose (no fly-in stutter).
 */
export function CoverCard({
  item,
  isCenter,
  cover,
  round,
  accent,
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
  accent: string;
  showPlay: boolean;
  transform: CoverTransform;
  onActivate: () => void;
  onDoubleOpen?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onPlay: () => void;
}) {
  const { t } = useTranslation();
  const o = transform;
  return (
    <motion.div
      onDoubleClick={onDoubleOpen}
      onContextMenu={onContextMenu}
      initial={false}
      animate={{ x: o.x, z: o.tz, rotateY: o.ry, scale: o.sc, opacity: o.op }}
      transition={{ duration: 0.32, ease: CARD_EASE }}
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
      {/* cover */}
      <div className="relative" style={{ width: cover, height: cover }}>
        <div
          // 3D card surface, not valid native button content — role="button" +
          // keyboard is the right pattern, while the play fab remains a sibling
          // so it cannot be swallowed by the cover activation target.
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
          role="button"
          tabIndex={0}
          aria-label={item.name}
          onClick={onActivate}
          onKeyDown={activateOnKey(onActivate)}
        >
          <Art
            seed={item.seed}
            grad={item.grad}
            image={item.image}
            images={item.images}
            // No grain here: ~13 covers + their reflections each carry a mix-blend
            // grain layer, and re-blending them all against the backdrop every frame
            // dropped frames during fast flips.
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
        </div>
        {showPlay && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            aria-label={t("a11y.playItem", { name: item.name })}
            className="absolute z-[5] grid h-[52px] w-[52px] place-items-center rounded-full"
            style={{
              // On a circle the square corner sits outside the disc, so pull the
              // button inward to rest on the lower-right edge.
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
      {/* reflection — classic Cover Flow mirror on the floor below the cover.
          scaleY(-1) about CENTER keeps the mirror below (origin "top" would flip
          it up over the cover, hiding it); since the flip also mirrors the mask,
          the gradient is `to top` so the edge touching the cover stays brightest
          and fades downward. */}
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
        {item.image && (
          <img
            src={item.image}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
    </motion.div>
  );
}
