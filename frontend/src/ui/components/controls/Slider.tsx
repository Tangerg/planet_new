import { Slider as BaseSlider } from "@base-ui/react/slider";
import React from "react";
import { cn } from "@/lib/cn";

const toArray = (v: number | readonly number[]): number[] =>
  Array.isArray(v) ? [...v] : [v as number];

export type SliderProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onChange" | "defaultValue"
> & {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  parts?: {
    track?: { className?: string; style?: React.CSSProperties };
    range?: { className?: string; style?: React.CSSProperties };
    thumb?: { className?: string; style?: React.CSSProperties };
  };
  thumbLabel?: string;
  ref?: React.Ref<HTMLDivElement>;
};

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
