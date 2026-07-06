import { useTranslation } from "react-i18next";

import { ToggleGroup } from "@/components/controls/ToggleGroup";
import { Icon } from "@/infra/icons";
import "./ViewToggle.css";

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
  const { t } = useTranslation();
  return (
    <ToggleGroup
      ariaLabel={t("common.viewMode")}
      className="viewtoggle"
      value={value}
      onValueChange={onChange}
      style={style}
      items={[
        { value: "list", label: <Icon.list size={17} />, "aria-label": t("common.listView") },
        { value: "grid", label: <Icon.grid size={17} />, "aria-label": t("common.gridView") },
        { value: "flow", label: <Icon.flow size={17} />, "aria-label": t("a11y.coverFlowView") },
      ]}
    />
  );
}
