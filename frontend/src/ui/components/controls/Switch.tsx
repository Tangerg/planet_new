import { Switch as BaseSwitch } from "@base-ui/react/switch";
import React from "react";
import "./Switch.css";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  "aria-label"?: string;
  id?: string;
  ref?: React.Ref<React.ComponentRef<typeof BaseSwitch.Root>>;
};

/**
 * Base UI-backed switch.
 * Base UI supplies the switch semantics, keyboard, and focus. Visuals live in
 * Switch.css, driven off Base UI's `data-checked` attribute (Radix exposed
 * `data-state="checked"`). The wrapper's public API is unchanged, so consumers
 * stay untouched — that's what makes the swap incremental.
 */
export function Switch({ ref, checked, onCheckedChange, ...rest }: SwitchProps) {
  return (
    <BaseSwitch.Root
      ref={ref}
      className="vswitch"
      checked={checked}
      onCheckedChange={onCheckedChange}
      {...rest}
    >
      <BaseSwitch.Thumb className="vswitch-thumb" />
    </BaseSwitch.Root>
  );
}
