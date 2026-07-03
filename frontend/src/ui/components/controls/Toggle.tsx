import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import React from "react";
import { cn } from "@/lib/cn";
import "./Button.css";

export type ToggleProps = React.ComponentPropsWithoutRef<typeof BaseToggle>;

/**
 * On/off control (shuffle · repeat · like). Base UI Toggle adds `aria-pressed` +
 * `data-pressed` over a native button; `.btn` supplies the chrome reset shared
 * with <Button>. The per-state colour stays inline (driven by the live accent
 * prop), so no data-attribute CSS is coupled here.
 */
export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { className, ...rest },
  ref,
) {
  return <BaseToggle ref={ref} className={cn("btn", className)} {...rest} />;
});
