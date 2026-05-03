import * as React from "react";
import { cn } from "../lib/cn";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg bg-surface text-white shadow-elevated",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export { Card };
