import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/controls/Button";

type SectionHeadProps = {
  title: string;
  onAll?: () => void;
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
