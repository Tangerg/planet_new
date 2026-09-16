import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import React from "react";
import type { PopupSide } from "./popup";

export const TooltipProvider = BaseTooltip.Provider;

type TooltipProps = {
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
