import { useTranslation } from "react-i18next";

import { Button } from "@/components/controls/Button";
import { Tooltip } from "@/components/controls/Tooltip";
import { Icon } from "@/infra/icons";

type Props = {
  playing: boolean;
  onTogglePlay: () => void;
  accent: string;
  onNext?: () => void;
  onPrev?: () => void;
};

export function TransportControls({ playing, onTogglePlay, accent, onNext, onPrev }: Props) {
  const { t } = useTranslation();
  const ctlCls = "grid place-items-center p-[5px]";
  const ctlColor = { color: "rgba(20,20,24,.78)" };
  const playLabel = playing ? t("common.pause") : t("common.play");

  return (
    <div className="relative z-[1] flex flex-none items-center gap-1">
      <Tooltip label={t("common.previous")}>
        <Button
          className={ctlCls}
          style={ctlColor}
          onClick={() => onPrev?.()}
          aria-label={t("common.previous")}
        >
          <Icon.prev size={21} />
        </Button>
      </Tooltip>
      <Tooltip label={playLabel}>
        <Button
          className="mx-0.5 grid h-11 w-11 place-items-center rounded-full"
          style={{
            background: accent,
            color: "#06060a",
            boxShadow: `0 6px 18px -4px ${accent}`,
          }}
          onClick={onTogglePlay}
          aria-label={playLabel}
        >
          {playing ? <Icon.pause size={22} /> : <Icon.play size={22} />}
        </Button>
      </Tooltip>
      <Tooltip label={t("common.next")}>
        <Button
          className={ctlCls}
          style={ctlColor}
          onClick={() => onNext?.()}
          aria-label={t("common.next")}
        >
          <Icon.next size={21} />
        </Button>
      </Tooltip>
    </div>
  );
}
