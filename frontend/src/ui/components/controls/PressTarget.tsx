import type React from "react";

import { activateOnKey } from "@/lib/keys";

type PressTargetProps = {
  /** Accessible name announced for the activation (aria-label). */
  label: string;
  /**
   * Mouse click and keyboard Enter/Space share this one handler. A target nested
   * inside another clickable surface (e.g. a card whose whole body also activates)
   * calls `e.stopPropagation()` here to avoid a double activation.
   */
  onActivate: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void;
  /** Take the element out of the tab order (e.g. an unavailable track row). */
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
};

/**
 * The accessible activation surface for rich content that can't be a native
 * `<button>`: art tiles, track/collection rows, titles — their children are
 * block or interactive elements that are invalid inside button semantics. It
 * wires the `role="button"` contract (tabIndex, aria-label, Enter/Space via
 * onKeyDown, sharing one handler with the click) in ONE place, so the many
 * card/row/tile surfaces stop repeating it — and stop each carrying their own
 * jsx-a11y disable. For a genuinely simple text label, use a native `<button>`.
 */
export function PressTarget({
  label,
  onActivate,
  disabled,
  className,
  style,
  onContextMenu,
  children,
}: PressTargetProps) {
  return (
    <div
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- rich content (art/rows/titles) is invalid inside a native <button>; role="button" + keyboard activation is the accessible equivalent.
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      onClick={onActivate}
      onKeyDown={activateOnKey(onActivate)}
      onContextMenu={onContextMenu}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}
