import { Slot } from "@radix-ui/react-slot";
import React from "react";
import { cn } from "@/lib/cn";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Render onto the child element (Radix Slot) instead of a <button>. */
  asChild?: boolean;
};

/**
 * Base button: the reset + keyboard `:focus-visible` ring + tactile `:active`
 * press that every control should share (the hand-rolled `<button>`s had none).
 * The per-context look stays inline / in vibe.css and is passed through via
 * `style`/`className` — `.btn` only adds behavior, so adopting it is visually
 * non-destructive. `asChild` (Radix Slot) lets non-button triggers reuse it.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { asChild, className, type, ...rest },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn("btn", className)}
      // Slot forwards type to whatever element it renders; only set the default
      // when we own the <button> (an <a>/<div> child shouldn't get type).
      type={asChild ? undefined : (type ?? "button")}
      {...rest}
    />
  );
});
