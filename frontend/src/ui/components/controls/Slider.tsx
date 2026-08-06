import { Slider as BaseSlider } from "@base-ui/react/slider";
import React from "react";
import { cn } from "@/lib/cn";

/** Base UI reports a bare number for single-thumb sliders; our callers work in
 *  arrays (matching the value shape), so normalize back to an array. */
const toArray = (v: number | readonly number[]): number[] =>
  Array.isArray(v) ? [...v] : [v as number];

export type SliderProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onChange" | "defaultValue"
> & {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  /** Fires when a drag/keyboard change is committed (Radix's onValueCommit). */
  onValueCommit?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  /**
   * Per-part style hooks. The vibe sliders are driven by runtime values (accent
   * gradients, computed fills) that can't be static utilities, so each part
   * takes its own inline style / className from the call site. `range` maps to
   * Base UI's Indicator (the filled portion).
   */
  parts?: {
    track?: { className?: string; style?: React.CSSProperties };
    range?: { className?: string; style?: React.CSSProperties };
    thumb?: { className?: string; style?: React.CSSProperties };
  };
  thumbLabel?: string;
  ref?: React.Ref<HTMLDivElement>;
};

/**
 * Base UI-backed slider. Base UI adds a `Control` wrapper around the `Track`
 * (Root › Control › Track › Indicator + Thumb) and renames the fill to
 * `Indicator`; the Control gets an orientation-aware fill layout so the rail
 * lays out exactly as before, and callers still own the visuals via `parts`.
 * The Thumb auto-positions; keyboard control, ARIA, and robust drag come free.
 */
export function Slider({
  ref,
  value,
  onValueChange,
  onValueCommit,
  min,
  max,
  step,
  orientation = "horizontal",
  disabled,
  parts,
  thumbLabel,
  children,
  className,
  style,
  ...rest
}: SliderProps) {
  // Control is the extra Base UI layer between Root and Track; make it a
  // transparent, orientation-aware flex box so the Track fills like it did
  // directly under the Radix Root.
  const controlStyle: React.CSSProperties =
    orientation === "vertical"
      ? { display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }
      : { display: "flex", alignItems: "center", flex: 1, minWidth: 0 };

  return (
    <BaseSlider.Root
      ref={ref}
      className={cn(className)}
      style={style}
      value={value}
      onValueChange={onValueChange ? (v) => onValueChange(toArray(v)) : undefined}
      onValueCommitted={onValueCommit ? (v) => onValueCommit(toArray(v)) : undefined}
      min={min}
      max={max}
      step={step}
      orientation={orientation}
      disabled={disabled}
      {...rest}
    >
      <BaseSlider.Control style={controlStyle}>
        <BaseSlider.Track className={parts?.track?.className} style={parts?.track?.style}>
          <BaseSlider.Indicator className={parts?.range?.className} style={parts?.range?.style} />
          <BaseSlider.Thumb
            className={parts?.thumb?.className}
            style={parts?.thumb?.style}
            aria-label={thumbLabel}
          />
        </BaseSlider.Track>
      </BaseSlider.Control>
      {children}
    </BaseSlider.Root>
  );
}
