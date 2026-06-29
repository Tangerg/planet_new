import * as RadixTooltip from "@radix-ui/react-tooltip";
import React from "react";

/**
 * Small dark tooltip (Spotify-style) that names what a control does on hover /
 * focus. Built on Radix Tooltip: keyboard-focus + ARIA `aria-describedby` for
 * free. Wrap a SINGLE focusable element (our Button/Toggle forward the trigger
 * props + ref via asChild). One `TooltipProvider` at the app root sets the
 * shared open delay.
 */
export const TooltipProvider = RadixTooltip.Provider;

type TooltipProps = {
  /** The text shown on hover (e.g. "Enable repeat", "Lyrics"). */
  label: string;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
};

export function Tooltip({ label, side = "top", children }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={9}
          className="z-[9999] select-none rounded-[7px] px-2.5 py-[7px] text-[11px] font-semibold tracking-[0.01em] text-white shadow-pop"
          style={{ background: "#2a2a32", border: "0.5px solid rgba(255,255,255,.12)" }}
        >
          {label}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
