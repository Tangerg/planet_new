// ============================================================
// PlayFab — the accent circular play button that rises from below as its
// enclosing LiftCard lifts (RiseFab handles the rise via variant propagation).
// Positioning/colour vary per card, so callers pass className/style; this only
// owns the rise + the play glyph + stop-propagation so the card's own click
// doesn't also fire.
// ============================================================
import React from "react";
import { RiseFab } from "@/components/lift";
import { Icon } from "@/infra/icons";

type PlayFabProps = {
  onPlay: () => void;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
};

export function PlayFab({ onPlay, size = 18, className, style, ...rest }: PlayFabProps) {
  return (
    <RiseFab
      className={className}
      style={style}
      aria-label={rest["aria-label"] ?? "Play"}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onPlay();
      }}
    >
      <Icon.play size={size} />
    </RiseFab>
  );
}
