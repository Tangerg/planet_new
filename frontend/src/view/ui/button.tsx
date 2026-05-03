import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-ui font-bold transition-colors transition-transform select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]",
  {
    variants: {
      variant: {
        // Spotify Green primary CTA — uppercase, wide tracking
        primary:
          "bg-accent text-black hover:bg-accent/90 hover:scale-[1.04] uppercase tracking-button text-sm",
        // Dark pill
        pill:
          "bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] uppercase tracking-button text-sm",
        // Outlined pill
        outline:
          "bg-transparent text-white border border-[#7c7c7c] hover:border-white hover:scale-[1.02] uppercase tracking-button text-sm",
        // Transparent ghost — for top icon buttons
        ghost:
          "bg-transparent text-text-muted hover:text-white",
        // Subtle text link
        link: "bg-transparent text-text-muted hover:text-white underline-offset-4 hover:underline",
      },
      size: {
        // Pill button heights
        sm: "h-8 px-3 rounded-full-pill",
        md: "h-10 px-4 rounded-full-pill",
        lg: "h-12 px-8 rounded-pill",
        // Circular icon sizes
        icon: "h-8 w-8 rounded-full",
        "icon-md": "h-10 w-10 rounded-full",
        "icon-lg": "h-14 w-14 rounded-full",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "icon",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
