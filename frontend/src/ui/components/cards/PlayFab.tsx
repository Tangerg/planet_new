import React from "react";
import { useTranslation } from "react-i18next";
import { RiseFab } from "@/components/lift";
import { Icon } from "@/infra/icons";

type PlayFabProps = {
  onPlay: () => void;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
};

export function PlayFab({ onPlay, size = 18, className, style, ...rest }: PlayFabProps) {
  const { t } = useTranslation();
  return (
    <RiseFab
      className={className}
      style={style}
      aria-label={rest["aria-label"] ?? t("common.play")}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onPlay();
      }}
    >
      <Icon.play size={size} />
    </RiseFab>
  );
}
