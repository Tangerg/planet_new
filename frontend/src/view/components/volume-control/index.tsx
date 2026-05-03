import React, { JSX } from "react";
import { Volume, Volume1, Volume2, VolumeX } from "lucide-react";

import { Slider } from "../../ui/slider";
import { Tooltip } from "../../ui/tooltip";
import { usePlanet } from "../../hooks/usePlanet";
import { useVolume } from "../../hooks/useVolume";
import { cn } from "../../lib/cn";

export interface VolumeControlProps {
  /** 滑块宽度。默认 96px（player 底栏）；NowPlaying 用 128px。 */
  sliderWidth?: number;
  className?: string;
}

/**
 * Mute 图标 + 滑块的复合控件。
 * 图标按音量梯度切换 VolumeX / Volume / Volume1 / Volume2。
 */
const VolumeControl: React.FC<VolumeControlProps> = ({
  sliderWidth = 96,
  className,
}) => {
  const planet = usePlanet();
  const [volume] = useVolume();

  const renderIcon = (): JSX.Element => {
    if (volume === 0) return <VolumeX size={18} />;
    if (volume < 10) return <Volume size={18} />;
    if (volume < 60) return <Volume1 size={18} />;
    return <Volume2 size={18} />;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Tooltip content={volume === 0 ? "Unmute" : "Mute"}>
        <button
          onClick={() => planet.hooks.emit("mute_or_unmute")}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:text-white"
        >
          {renderIcon()}
        </button>
      </Tooltip>
      <div style={{ width: sliderWidth }}>
        <Slider
          value={[volume]}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => planet.hooks.emit("change_volume", v[0])}
        />
      </div>
    </div>
  );
};

export default VolumeControl;
