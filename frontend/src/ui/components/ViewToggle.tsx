import { ToggleGroup } from "@/components/controls/ToggleGroup";
import { Icon } from "@/components/primitives";

type ViewToggleProps = {
  value: string;
  onChange: (v: string) => void;
  style?: React.CSSProperties;
};

/**
 * The list / grid / flow view switcher, shared by Library, Detail and Artist
 * (was repeated inline in all three). Order is fixed list → grid → flow
 * everywhere. A vibe composition of the generic ToggleGroup + vibe icons + the
 * `.viewtoggle` design-system class — so it lives here, not in ui/components.
 */
export function ViewToggle({ value, onChange, style }: ViewToggleProps) {
  return (
    <ToggleGroup
      ariaLabel="View mode"
      className="viewtoggle"
      value={value}
      onValueChange={onChange}
      style={style}
      items={[
        { value: "list", label: <Icon.list size={17} />, "aria-label": "List view" },
        { value: "grid", label: <Icon.grid size={17} />, "aria-label": "Grid view" },
        { value: "flow", label: <Icon.flow size={17} />, "aria-label": "Cover flow view" },
      ]}
    />
  );
}
