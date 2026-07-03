import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import React from "react";
import "./ToggleGroup.css";

export type ToggleItem = {
  value: string;
  label: React.ReactNode;
  /** Accessible name for icon-only items. */
  "aria-label"?: string;
};

export type ToggleGroupProps = {
  value: string;
  onValueChange: (value: string) => void;
  items: ToggleItem[];
  className?: string;
  /** Class applied to every item (e.g. `tab`); visuals key off `data-pressed`. */
  itemClassName?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
};

/**
 * Base UI-backed single-select toggle group. Replaces the hand-rolled tab /
 * segmented / view-mode button rows (plain `<button>`s with no roving focus or
 * tablist semantics); Base UI supplies arrow-key roving, focus, and ARIA.
 * Visuals stay in vibe.css (`.tab`, `.viewtoggle`, `.seg`) and key off Base UI's
 * `data-pressed` (Radix used `data-state="on"`), so the look is unchanged.
 *
 * Base UI models the value as an array even in single-select mode; we adapt to a
 * single string and swallow the empty result when the active item is re-pressed,
 * so a selection is always kept (these are navigation selectors, not optional
 * toggles).
 */
export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(function ToggleGroup(
  { value, onValueChange, items, className, itemClassName, style, ariaLabel },
  ref,
) {
  return (
    <BaseToggleGroup
      ref={ref}
      value={[value]}
      onValueChange={(groupValue) => {
        const next = groupValue[0];
        if (typeof next === "string") onValueChange(next);
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
});
