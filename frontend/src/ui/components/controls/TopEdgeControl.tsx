import React from "react";

import { Button } from "@/components/controls/Button";

/**
 * A control docked to the window's top edge on an immersive screen (Now Playing,
 * the visualiser stage, the MV theater) — screens that hide the window chrome
 * and so have nowhere else to hang a close or mode button.
 *
 * The z-index is why this is a component. The frameless window's top edge is
 * made draggable by a transparent strip at z-10 (ShellWindowChrome); a control
 * that does not clear it has its clicks swallowed by the drag handle, which this
 * exact layout has already been bitten by. Written out per screen, that z drifts
 * — it already had, at z-30 on two screens and z-40 on a third. One component
 * keeps one z correct.
 *
 * `slot` counts leftwards from the right edge, so screens place controls by
 * order rather than by rediscovering the offsets.
 */
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
