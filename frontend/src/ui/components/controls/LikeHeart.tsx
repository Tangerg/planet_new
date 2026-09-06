// ============================================================
// LikeHeart — the large glowing like-heart used on full-bleed surfaces (Now
// Playing, Comments): accent-tinted with a soft accent glow. The dense list/bar
// hearts (TrackRow, PlayerBar) stay inline — their colour is hover/context-driven.
// ============================================================
import { useTranslation } from "react-i18next";
import { Button } from "@/components/controls/Button";
import { Icon } from "@/infra/icons";
import { useAccent } from "@/hooks/accent";

type LikeHeartProps = {
  liked: boolean;
  onToggle: () => void;
  size?: number;
};

export function LikeHeart({ liked, onToggle, size = 30 }: LikeHeartProps) {
  const accent = useAccent();
  const { t } = useTranslation();
  return (
    <Button
      onClick={onToggle}
      aria-label={t("a11y.like")}
      className="p-0"
      style={{ color: accent, filter: `drop-shadow(0 4px 12px ${accent}88)` }}
    >
      <Icon.heart size={size} filled={liked} />
    </Button>
  );
}
