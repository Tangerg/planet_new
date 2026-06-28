// ============================================================
// LikeHeart — the large glowing like-heart used on full-bleed surfaces (Now
// Playing, Comments): accent-tinted with a soft accent glow. The dense list/bar
// hearts (TrackRow, PlayerBar) stay inline — their colour is hover/context-driven.
// ============================================================
import React from "react";
import { Button } from "@/components/controls/Button";
import { Icon } from "@/infra/icons";

type LikeHeartProps = {
  liked: boolean;
  onToggle: () => void;
  accent: string;
  size?: number;
};

export function LikeHeart({ liked, onToggle, accent, size = 30 }: LikeHeartProps) {
  return (
    <Button
      onClick={onToggle}
      aria-label="Like"
      className="p-0"
      style={{ color: accent, filter: `drop-shadow(0 4px 12px ${accent}88)` }}
    >
      <Icon.heart size={size} filled={liked} />
    </Button>
  );
}
