import * as RadixToggle from "@radix-ui/react-toggle";
import React from "react";
import { cn } from "@/lib/cn";
import "./Button.css";

export type ToggleProps = React.ComponentPropsWithoutRef<typeof RadixToggle.Root>;

/**
 * On/off control (shuffle · repeat · like). Radix Toggle adds `aria-pressed` +
 * `data-state` over a plain button; `.btn` supplies the chrome reset shared with
 * <Button>. The per-state colour stays inline (driven by the live accent prop).
 */
export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { className, ...rest },
  ref,
) {
  return <RadixToggle.Root ref={ref} className={cn("btn", className)} {...rest} />;
});
