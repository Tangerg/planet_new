import React from "react";
import { cn } from "@/lib/cn";
import "./Button.css";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>;
};

/**
 * Base button: the reset + keyboard `:focus-visible` ring + tactile `:active`
 * press that every control shares. `.btn` only adds behavior, so adopting it is
 * visually non-destructive — the per-context look stays in `className`/`style`.
 *
 * It's a plain styled `<button>` with no headless-library dependency, and it
 * needs no polymorphic escape hatch: a trigger that wants to BE this button
 * passes it through Base UI's `render` prop, which merges the trigger's props
 * and ref onto it. (If Button-as-`<a>` is ever wanted, reach for Base UI's
 * `useRender` rather than growing an `asChild` here.)
 */
export function Button({ ref, className, type, ...rest }: ButtonProps) {
  return <button ref={ref} className={cn("btn", className)} type={type ?? "button"} {...rest} />;
}
