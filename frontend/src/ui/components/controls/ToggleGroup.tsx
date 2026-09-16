import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import React from "react";
import "./ToggleGroup.css";

export type ToggleItem<TValue extends string = string> = {
  value: TValue;
  label: React.ReactNode;
  "aria-label"?: string;
};

export type ToggleGroupProps<TValue extends string = string> = {
  value: TValue;
  onValueChange: (value: TValue) => void;
  items: ToggleItem<TValue>[];
  className?: string;
  itemClassName?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  ref?: React.Ref<HTMLDivElement>;
};

export function ToggleGroup<TValue extends string>({
  value,
  onValueChange,
  items,
  className,
  itemClassName,
  style,
  ariaLabel,
  ref,
}: ToggleGroupProps<TValue>) {
  return (
    <BaseToggleGroup
      ref={ref}
      value={[value]}
      onValueChange={(groupValue) => {
        const selected = items.find((item) => item.value === groupValue[0]);
        if (selected) onValueChange(selected.value);
      }}
      className={className}
      style={style}
      aria-label={ariaLabel}
    >
      {items.map((it) => (
        <Toggle
          key={it.value}
          value={it.value}
          className={itemClassName}
          aria-label={it["aria-label"]}
        >
          {it.label}
        </Toggle>
      ))}
    </BaseToggleGroup>
  );
}
