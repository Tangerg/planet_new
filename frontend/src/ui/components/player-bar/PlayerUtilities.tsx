import { useState } from "react";

import { Button } from "@/components/controls/Button";
import { Toggle } from "@/components/controls/Toggle";
import { Tooltip } from "@/components/controls/Tooltip";
import { VolumeControl } from "@/components/player-bar/VolumeControl";
import { useScreenActions } from "@/hooks/screenActions";
import { Icon } from "@/infra/icons";
import { repeatTooltip } from "@/model/player";

type Props = {
  liked: boolean;
  toggleLike: () => void;
  shuffle: boolean;
  setShuffle: (value: boolean) => void;
  repeat: boolean;
  repeatOne: boolean;
  onToggleRepeat: () => void;
  volume: number;
  onVolume: (value: number) => void;
  accent: string;
  tintA: string;
  tintB: string;
  onOpenLyrics: () => void;
  onOpenQueue: () => void;
  onOpenComments: () => void;
};

export function PlayerUtilities({
  liked,
  toggleLike,
  shuffle,
  setShuffle,
  repeat,
  repeatOne,
  onToggleRepeat,
  volume,
  onVolume,
  accent,
  tintA,
  tintB,
  onOpenLyrics,
  onOpenQueue,
  onOpenComments,
}: Props) {
  const { enqueue } = useScreenActions();
  const [dragOver, setDragOver] = useState(false);
  const ctlCls = "grid place-items-center p-[5px]";
  const ctlColor = (on: boolean) => ({
    color: on ? accent : "rgba(20,20,24,.78)",
  });

  return (
    <div className="relative z-[1] flex flex-none items-center gap-1 pr-[18px]">
      <Tooltip label={liked ? "Remove from liked" : "Save to liked"}>
        <Toggle
          className={ctlCls}
          style={ctlColor(liked)}
          pressed={liked}
          onPressedChange={() => toggleLike()}
          aria-label="Like"
        >
          <Icon.heart size={18} filled={liked} />
        </Toggle>
      </Tooltip>
      <Tooltip label={shuffle ? "Disable shuffle" : "Enable shuffle"}>
        <Toggle
          className={ctlCls}
          style={ctlColor(shuffle)}
          pressed={shuffle}
          onPressedChange={setShuffle}
          aria-label="Shuffle"
        >
          <Icon.shuffle size={18} />
        </Toggle>
      </Tooltip>
      <Tooltip label={repeatTooltip(repeat, repeatOne)}>
        <Toggle
          className={ctlCls}
          style={ctlColor(repeat)}
          pressed={repeat}
          onPressedChange={() => onToggleRepeat()}
          aria-label={repeatOne ? "Repeat one" : "Repeat"}
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
      />
      <Tooltip label="Lyrics">
        <Button
          className={ctlCls}
          style={ctlColor(false)}
          onClick={onOpenLyrics}
          aria-label="Lyrics"
        >
          <Icon.lyrics size={18} />
        </Button>
      </Tooltip>
      <Tooltip label="Queue">
        <Button
          className={ctlCls}
          style={ctlColor(dragOver)}
          onClick={onOpenQueue}
          aria-label="Up next"
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("text/sonance-track")) {
              e.preventDefault();
              setDragOver(true);
            }
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const id = e.dataTransfer.getData("text/sonance-track");
            if (id) enqueue(id);
          }}
        >
          <Icon.list size={18} />
        </Button>
      </Tooltip>
      <Tooltip label="Comments">
        <Button
          className={ctlCls}
          style={ctlColor(false)}
          onClick={onOpenComments}
          aria-label="Comments"
        >
          <Icon.comment size={18} />
        </Button>
      </Tooltip>
    </div>
  );
}
