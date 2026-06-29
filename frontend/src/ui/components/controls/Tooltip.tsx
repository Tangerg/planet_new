import * as RadixTooltip from "@radix-ui/react-tooltip";
import React from "react";
import "./Tooltip.css";

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
          className="tooltip-pop z-[9999] select-none px-3 py-2 text-[11.5px] font-medium tracking-[0.01em]"
        >
          {label}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
