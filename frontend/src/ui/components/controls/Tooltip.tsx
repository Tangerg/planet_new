import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import React from "react";
import type { PopupSide } from "./popup";

/**
 * Small dark tooltip (Spotify-style) that names what a control does on hover /
 * focus. Built on Base UI Tooltip: keyboard-focus + ARIA `aria-describedby` for
 * free. Wrap a SINGLE focusable element — Base UI has no `asChild`, so the child
 * is passed through the Trigger's `render` prop, which merges the trigger props +
 * ref onto it (our Button/Toggle forward both). One `TooltipProvider` at the app
 * root sets the shared open delay.
 */
export const TooltipProvider = BaseTooltip.Provider;

type TooltipProps = {
  /** The text shown on hover (e.g. "Enable repeat", "Lyrics"). */
  label: string;
  side?: PopupSide;
  children: React.ReactElement;
};

export function Tooltip({ label, side = "top", children }: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={9}>
          <BaseTooltip.Popup className="glass-pop z-[9999] select-none px-3 py-2 text-[11.5px] font-medium tracking-[0.01em]">
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
