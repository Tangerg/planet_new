import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/controls/Button";
import { Toggle } from "@/components/controls/Toggle";
import { Tooltip } from "@/components/controls/Tooltip";
import { VolumeControl } from "@/components/player-bar/VolumeControl";
import { useScreenActions } from "@/hooks/screenActions";
import { Icon } from "@/infra/icons";
import { repeatTooltip } from "@/model/player";
import { canAcceptTrackDrag, readTrackDragData } from "@/model/track-actions";

type Props = {
  liked: boolean;
  toggleLike: () => void;
  shuffle: boolean;
  onToggleShuffle: () => void;
  repeat: boolean;
  repeatOne: boolean;
  onToggleRepeat: () => void;
  volume: number;
  onVolume: (value: number) => void;
  onToggleMute: () => void;
  accent: string;
  tintA: string;
  tintB: string;
  onOpenStage: () => void;
  onOpenLyrics: () => void;
  onOpenQueue: () => void;
  onOpenComments: () => void;
};

export function PlayerUtilities({
  liked,
  toggleLike,
  shuffle,
  onToggleShuffle,
  repeat,
  repeatOne,
  onToggleRepeat,
  volume,
  onVolume,
  onToggleMute,
  accent,
  tintA,
  tintB,
  onOpenStage,
  onOpenLyrics,
  onOpenQueue,
  onOpenComments,
}: Props) {
  const { t } = useTranslation();
  const { enqueue } = useScreenActions();
  const [dragOver, setDragOver] = useState(false);
  const ctlCls = "grid place-items-center p-[5px]";
  const ctlColor = (on: boolean) => ({
    color: on ? accent : "rgba(20,20,24,.78)",
  });

  return (
    <div className="relative z-[1] flex flex-none items-center gap-1 pr-[18px]">
      <Tooltip label={liked ? t("common.removeFromLiked") : t("common.saveToLiked")}>
        <Toggle
          className={ctlCls}
          style={ctlColor(liked)}
          pressed={liked}
          onPressedChange={() => toggleLike()}
          aria-label={t("a11y.like")}
        >
          <Icon.heart size={18} filled={liked} />
        </Toggle>
      </Tooltip>
      <Tooltip label={shuffle ? t("player.disableShuffle") : t("player.enableShuffle")}>
        <Toggle
          className={ctlCls}
          style={ctlColor(shuffle)}
          pressed={shuffle}
          onPressedChange={onToggleShuffle}
          aria-label={t("common.shuffle")}
        >
          <Icon.shuffle size={18} />
        </Toggle>
      </Tooltip>
      <Tooltip label={t(repeatTooltip(repeat, repeatOne))}>
        <Toggle
          className={ctlCls}
          style={ctlColor(repeat)}
          pressed={repeat}
          onPressedChange={() => onToggleRepeat()}
          aria-label={repeatOne ? t("common.repeatOne") : t("common.repeat")}
        >
          {repeatOne ? <Icon.loopOne size={18} /> : <Icon.loop size={18} />}
        </Toggle>
      </Tooltip>
      <VolumeControl
        accent={accent}
        tintA={tintA}
        tintB={tintB}
        volume={volume}
        onVolume={onVolume}
        onToggleMute={onToggleMute}
      />
      <Tooltip label={t("common.visualizer")}>
        <Button
          className={ctlCls}
          style={ctlColor(false)}
          onClick={onOpenStage}
          aria-label={t("common.visualizer")}
        >
          <Icon.bars size={18} />
        </Button>
      </Tooltip>
      <Tooltip label={t("common.lyrics")}>
        <Button
          className={ctlCls}
          style={ctlColor(false)}
          onClick={onOpenLyrics}
          aria-label={t("common.lyrics")}
        >
          <Icon.lyrics size={18} />
        </Button>
      </Tooltip>
      <Tooltip label={t("common.queue")}>
        <Button
          className={ctlCls}
          style={ctlColor(dragOver)}
          onClick={onOpenQueue}
          aria-label={t("common.upNext")}
          onDragOver={(e) => {
            if (canAcceptTrackDrag(e.dataTransfer.types)) {
              e.preventDefault();
              setDragOver(true);
            }
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const id = readTrackDragData(e.dataTransfer);
            if (id) enqueue(id);
          }}
        >
          <Icon.list size={18} />
        </Button>
      </Tooltip>
      <Tooltip label={t("common.comments")}>
        <Button
          className={ctlCls}
          style={ctlColor(false)}
          onClick={onOpenComments}
          aria-label={t("common.comments")}
        >
          <Icon.comment size={18} />
        </Button>
      </Tooltip>
    </div>
  );
}
