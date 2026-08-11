import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/controls/Button";
import { HoverCard } from "@/components/controls/HoverCard";
import { Slider } from "@/components/controls/Slider";
import { Icon } from "@/infra/icons";
import { volumeFromSliderValue, volumeLevel, volumeSliderValue } from "@/model/player";
import { useAccent } from "@/hooks/accent";

type Props = {
  tintA: string;
  tintB: string;
  volume: number;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
};

export function VolumeControl({ tintA, tintB, volume, onVolume, onToggleMute }: Props) {
  const accent = useAccent();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const volumeIconByLevel = {
    muted: Icon.volumeMute,
    low: Icon.volumeLow,
    high: Icon.volume,
  };
  const VolumeIcon = volumeIconByLevel[volumeLevel(volume)];

  return (
    <HoverCard
      open={open}
      onOpenChange={setOpen}
      openDelay={0}
      closeDelay={120}
      side="top"
      align="center"
      sideOffset={12}
      className="volpop z-[9000] flex flex-col items-center gap-3 rounded-[14px] px-[9px] pb-[13px] pt-[15px]"
      style={{
        background: `linear-gradient(120deg, ${tintA}38, ${tintB}38), rgba(247,246,244,.86)`,
        border: "0.5px solid rgba(255,255,255,.6)",
        WebkitBackdropFilter: "blur(22px) saturate(180%)",
        backdropFilter: "blur(22px) saturate(180%)",
        boxShadow: "0 16px 38px -14px rgba(0,0,0,.32)",
      }}
      trigger={
        <Button
          className="grid place-items-center p-[5px]"
          style={{ color: "rgba(20,20,24,.78)" }}
          aria-label={t("common.volume")}
          onClick={onToggleMute}
        >
          <VolumeIcon size={18} />
        </Button>
      }
    >
      <span className="block w-[22px] text-center font-mono text-[9.5px] tracking-[0.1em] text-[rgba(20,20,24,0.5)] tabular-nums">
        {Math.round(volume)}
      </span>
      <Slider
        orientation="vertical"
        min={0}
        max={1}
        step={0.01}
        value={[volumeSliderValue(volume)]}
        onValueChange={([v]) => onVolume(volumeFromSliderValue(v))}
        thumbLabel={t("common.volume")}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 12,
          height: 96,
          cursor: "pointer",
          touchAction: "none",
        }}
        parts={{
          track: {
            style: {
              position: "relative",
              width: 4,
              height: "100%",
              borderRadius: 999,
              background: "rgba(20,20,24,.16)",
            },
          },
          range: {
            style: {
              position: "absolute",
              left: 0,
              right: 0,
              background: accent,
              borderRadius: 999,
            },
          },
          thumb: {
            style: {
              display: "block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: `0 0 0 1px ${accent}, 0 1px 3px rgba(0,0,0,.4)`,
            },
          },
        }}
      />
    </HoverCard>
  );
}
