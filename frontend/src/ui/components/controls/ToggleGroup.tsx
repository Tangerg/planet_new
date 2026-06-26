import * as RTG from "@radix-ui/react-toggle-group";
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
  /** Class applied to every item (e.g. `tab`); visuals key off `data-state`. */
  itemClassName?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
};

/**
 * Radix-backed single-select toggle group. Replaces the hand-rolled tab /
 * segmented / view-mode button rows (plain `<button>`s with no roving focus or
 * tablist semantics); Radix supplies arrow-key roving, focus, and ARIA. Visuals
 * stay in vibe.css (`.tab`, `.viewtoggle`, `.seg`) and key off Radix's
 * `data-state="on"`, so the look is unchanged.
 *
 * `type="single"` lets Radix clear the value when the active item is re-pressed;
 * we swallow the empty result so a selection is always kept (these are
 * navigation selectors, not optional toggles).
 */
export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(function ToggleGroup(
  { value, onValueChange, items, className, itemClassName, style, ariaLabel },
  ref,
) {
  return (
    <RTG.Root
      ref={ref}
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onValueChange(v);
      }}
      className={className}
      style={style}
      aria-label={ariaLabel}
      loop
    >
      {items.map((it) => (
        <RTG.Item
          key={it.value}
          value={it.value}
          className={itemClassName}
          aria-label={it["aria-label"]}
        >
          {it.label}
        </RTG.Item>
      ))}
    </RTG.Root>
  );
});
