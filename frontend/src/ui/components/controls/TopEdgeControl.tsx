import React from "react";

import { Button } from "@/components/controls/Button";

const SLOT_RIGHT_PX = 56;
const SLOT_PITCH_PX = 36;

export function TopEdgeControl({
  slot = 0,
  label,
  onClick,
  children,
}: {
  slot?: number;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      onClick={onClick}
      aria-label={label}
      className="absolute top-[18px] z-30 p-1 text-white/70"
      style={{ right: SLOT_RIGHT_PX + slot * SLOT_PITCH_PX }}
    >
      {children}
    </Button>
  );
}
