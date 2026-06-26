import * as RadixSwitch from "@radix-ui/react-switch";
import React from "react";
import "./Switch.css";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  "aria-label"?: string;
  id?: string;
};

/**
 * Radix-backed switch. Replaces the hand-rolled `role="switch"` div (manual
 * aria-checked + keydown); Radix supplies the button semantics, keyboard, and
 * focus for free. Visuals live in vibe.css (`.vswitch` / `.vswitch-thumb`),
 * driven off Radix's `data-state`, so the look is unchanged.
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onCheckedChange, ...rest },
  ref,
) {
  return (
    <RadixSwitch.Root
      ref={ref}
      className="vswitch"
      checked={checked}
      onCheckedChange={onCheckedChange}
      {...rest}
    >
      <RadixSwitch.Thumb className="vswitch-thumb" />
    </RadixSwitch.Root>
  );
});
