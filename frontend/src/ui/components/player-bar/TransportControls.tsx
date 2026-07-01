import { Button } from "@/components/controls/Button";
import { Tooltip } from "@/components/controls/Tooltip";
import { Icon } from "@/infra/icons";

type Props = {
  playing: boolean;
  setPlaying: (value: boolean) => void;
  accent: string;
  onNext?: () => void;
  onPrev?: () => void;
};

export function TransportControls({ playing, setPlaying, accent, onNext, onPrev }: Props) {
  const ctlCls = "grid place-items-center p-[5px]";
  const ctlColor = { color: "rgba(20,20,24,.78)" };

  return (
    <div className="relative z-[1] flex flex-none items-center gap-1">
      <Tooltip label="Previous">
        <Button
          className={ctlCls}
          style={ctlColor}
          onClick={() => onPrev?.()}
          aria-label="Previous"
        >
          <Icon.prev size={21} />
        </Button>
      </Tooltip>
      <Tooltip label={playing ? "Pause" : "Play"}>
        <Button
          className="mx-0.5 grid h-11 w-11 place-items-center rounded-full"
          style={{
            background: accent,
            color: "#06060a",
            boxShadow: `0 6px 18px -4px ${accent}`,
          }}
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Icon.pause size={22} /> : <Icon.play size={22} />}
        </Button>
      </Tooltip>
      <Tooltip label="Next">
        <Button className={ctlCls} style={ctlColor} onClick={() => onNext?.()} aria-label="Next">
          <Icon.next size={21} />
        </Button>
      </Tooltip>
    </div>
  );
}
