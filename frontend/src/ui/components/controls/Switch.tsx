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
 * Base UI-backed switch: the library supplies the switch semantics, keyboard
 * and focus; visuals live in Switch.css, keyed off its `data-checked`.
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
