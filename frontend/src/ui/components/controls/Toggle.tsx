import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import React from "react";
import { cn } from "@/lib/cn";
import "./Button.css";

export type ToggleProps = React.ComponentPropsWithoutRef<typeof BaseToggle> & {
  ref?: React.Ref<HTMLButtonElement>;
};

export function Toggle({ ref, className, ...rest }: ToggleProps) {
  return <BaseToggle ref={ref} className={cn("btn", className)} {...rest} />;
}
