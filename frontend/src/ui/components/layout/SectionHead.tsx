// ============================================================
// SectionHead — the `.sech` section header (title + optional "Show all"),
// repeated across ForYou rails, Search result groups and Detail. Kept tiny;
// callers that need a bespoke header still use `.sech` directly.
// ============================================================
import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/controls/Button";

type SectionHeadProps = {
  title: string;
  onAll?: () => void;
  /** Override the heading font-size (some screens use 22). */
  size?: number;
  style?: React.CSSProperties;
};

export function SectionHead({ title, onAll, size, style }: SectionHeadProps) {
  const { t } = useTranslation();
  return (
    <div className="sech" style={style}>
      <h2 style={size ? { fontSize: size } : undefined}>{title}</h2>
      {onAll && (
        <Button className="all" onClick={onAll}>
          {t("common.showAll")}
        </Button>
      )}
    </div>
  );
}
