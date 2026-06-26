import * as RadixSlider from "@radix-ui/react-slider";
import React from "react";
import { cn } from "@/lib/cn";

type RootProps = React.ComponentPropsWithoutRef<typeof RadixSlider.Root>;

export type SliderProps = Omit<RootProps, "children"> & {
  /**
   * Per-part style hooks. The vibe sliders are driven by runtime values
   * (accent gradients, computed fills) that can't be static utilities, so each
   * Radix part takes its own inline style / className from the call site.
   */
  parts?: {
    track?: { className?: string; style?: React.CSSProperties };
    range?: { className?: string; style?: React.CSSProperties };
    thumb?: { className?: string; style?: React.CSSProperties };
  };
  thumbLabel?: string;
  /** Extra overlay nodes (e.g. a hover-time tooltip) rendered inside Root. */
  children?: React.ReactNode;
};

/**
 * Radix-backed slider. Replaces the hand-rolled pointer-capture scrubbers,
 * gaining keyboard control, ARIA, and robust drag for free. Radix positions
 * the Range (start/end edge %) and Thumb (absolute + start-edge calc); callers
 * own the visual via `parts` so the existing look is reproduced exactly.
 */
export const Slider = React.forwardRef<HTMLSpanElement, SliderProps>(function Slider(
  { parts, thumbLabel, children, className, ...root },
  ref,
) {
  return (
    <RadixSlider.Root ref={ref} className={cn(className)} {...root}>
      <RadixSlider.Track className={parts?.track?.className} style={parts?.track?.style}>
        <RadixSlider.Range className={parts?.range?.className} style={parts?.range?.style} />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        className={parts?.thumb?.className}
        style={parts?.thumb?.style}
        aria-label={thumbLabel}
      />
      {children}
    </RadixSlider.Root>
  );
});
