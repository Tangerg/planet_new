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
 * It's a plain styled `<button>` with no headless-library dependency: the former
 * `asChild` (Radix Slot) affordance was dropped once every trigger moved to Base
 * UI's `render` prop, leaving it unused. A trigger that wraps this Button passes
 * it through the library's `render`, which merges the trigger props + ref onto
 * the button — so no Slot is needed. (If Button-as-`<a>` is ever wanted, compose
 * it back via Base UI's `useRender`.)
 */
export function Button({ ref, className, type, ...rest }: ButtonProps) {
  return <button ref={ref} className={cn("btn", className)} type={type ?? "button"} {...rest} />;
}
