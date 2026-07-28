import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import React from "react";
import "./ToggleGroup.css";

export type ToggleItem<TValue extends string = string> = {
  value: TValue;
  label: React.ReactNode;
  /** Accessible name for icon-only items. */
  "aria-label"?: string;
};

export type ToggleGroupProps<TValue extends string = string> = {
  value: TValue;
  onValueChange: (value: TValue) => void;
  items: ToggleItem<TValue>[];
  className?: string;
  /** Class applied to every item (e.g. `tab`); visuals key off `data-pressed`. */
  itemClassName?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  ref?: React.Ref<HTMLDivElement>;
};

/**
 * Base UI-backed single-select toggle group. Replaces the hand-rolled tab /
 * segmented / view-mode button rows (plain `<button>`s with no roving focus or
 * tablist semantics); Base UI supplies arrow-key roving, focus, and ARIA.
 * Visuals stay in vibe.css (`.tab`, `.viewtoggle`, `.seg`) and key off Base UI's
 * `data-pressed` (Radix used `data-state="on"`), so the look is unchanged.
 *
 * Base UI models the value as an untyped array even in single-select mode. The
 * group is generic over its value union and narrows by looking the reported
 * value up in `items`, so callers with a closed union (view mode, library tab)
 * keep their type without casting at the call site. An unrecognized value —
 * including the empty result Base UI reports when the active item is re-pressed
 * — is swallowed, so a selection is always kept: these are navigation
 * selectors, not optional toggles.
 */
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
