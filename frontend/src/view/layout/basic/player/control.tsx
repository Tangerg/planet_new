import React, { JSX, useEffect, useState } from "react";
import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { motion } from "motion/react";

import type { FormattedDuration } from "../../../../packages/model/duration";
import { Slider } from "../../../ui/slider";
import { Tooltip } from "../../../ui/tooltip";
import { usePlanet } from "../../../hooks/usePlanet";
import { RepeatMode } from "../../../../packages/plugin/playqueue/repeat";
import { PlayState } from "../../../../packages/plugin";
import { useStore as usePlayQueueStore } from "../../../store/playqueue";
import { cn } from "../../../lib/cn";

type IconBtnProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
};

const IconBtn: React.FC<IconBtnProps> = ({
  label,
  active,
  onClick,
  children,
  className,
}) => (
  <Tooltip content={label}>
    <button
      onClick={onClick}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-full transition-colors",
        active ? "text-accent" : "text-text-muted hover:text-white",
        className,
      )}
    >
      {children}
      {active && (
        <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
      )}
    </button>
  </Tooltip>
);

const ShuffleBtn: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const planet = usePlanet();
  useEffect(() => {
    planet.hooks.on("shuffle_enable_changed", setEnabled);
    return () => {
      planet.hooks.off("shuffle_enable_changed", setEnabled);
    };
  }, []);
  return (
    <IconBtn
      label={enabled ? "Shuffle on" : "Shuffle"}
      active={enabled}
      onClick={() => planet.hooks.emit("change_shuffle_enable")}
    >
      <Shuffle size={16} />
    </IconBtn>
  );
};

const PreviousBtn: React.FC = () => {
  const planet = usePlanet();
  return (
    <IconBtn
      label="Previous"
      onClick={() => planet.hooks.emit("previous_track")}
    >
      <SkipBack size={18} />
    </IconBtn>
  );
};

const PlayPauseBtn: React.FC = () => {
  const [playState, setPlayState] = useState<PlayState>(PlayState.STOPED);
  const planet = usePlanet();
  useEffect(() => {
    planet.hooks.on("play_state_changed", setPlayState);
    return () => {
      planet.hooks.off("play_state_changed", setPlayState);
    };
  }, []);

  const tooltip =
    playState === PlayState.PLAYING ? "Pause" : "Play";
  const renderIcon = (): JSX.Element => {
    if (playState === PlayState.PLAYING) return <Pause size={18} fill="currentColor" />;
    return <Play size={18} fill="currentColor" />;
  };

  const onClick = () => {
    if (playState === PlayState.PLAYING) {
      planet.hooks.emit("pause");
    } else {
      planet.hooks.emit("play");
    }
  };

  return (
    <Tooltip content={tooltip}>
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={onClick}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-md hover:shadow-elevated"
      >
        {renderIcon()}
      </motion.button>
    </Tooltip>
  );
};

const NextBtn: React.FC = () => {
  const planet = usePlanet();
  return (
    <IconBtn label="Next" onClick={() => planet.hooks.emit("next_track")}>
      <SkipForward size={18} />
    </IconBtn>
  );
};

const RepeatBtn: React.FC = () => {
  const [mode, setMode] = useState<RepeatMode>(RepeatMode.OFF);
  const planet = usePlanet();
  useEffect(() => {
    planet.hooks.on("repeat_mode_changed", setMode);
    return () => {
      planet.hooks.off("repeat_mode_changed", setMode);
    };
  }, []);

  const tooltip =
    mode === RepeatMode.OFF
      ? "Repeat off"
      : mode === RepeatMode.ONE
      ? "Repeat one"
      : "Repeat all";

  const icon =
    mode === RepeatMode.ONE ? <Repeat1 size={16} /> : <Repeat size={16} />;

  return (
    <IconBtn
      label={tooltip}
      active={mode !== RepeatMode.OFF}
      onClick={() => planet.hooks.emit("change_repeat_mode")}
    >
      {icon}
    </IconBtn>
  );
};

const DurationLabel: React.FC<{ duration: FormattedDuration }> = ({
  duration,
}) => (
  <span className="w-10 text-right text-[11px] tabular-nums text-text-muted">
    {duration.durationFormatted}
  </span>
);

const ProgressBar: React.FC = () => {
  // 直接从 store 读取，避免组件 mount 时机晚于 track_duration_changed 事件
  // （NowPlaying 内复用同一个 Control，按需挂载会错过早先的 duration 事件）
  const progress = usePlayQueueStore.use.progress();
  const duration = usePlayQueueStore.use.duration();
  const planet = usePlanet();

  return (
    <div className="flex w-full items-center gap-2">
      <DurationLabel duration={progress} />
      <Slider
        value={[progress.percent]}
        max={100}
        step={1}
        onValueChange={(value) =>
          planet.hooks.emit("play_time_seek", value[0])
        }
      />
      <DurationLabel duration={duration} />
    </div>
  );
};

const Control: React.FC = () => (
  <div className="flex flex-col items-center gap-1.5">
    <div className="flex items-center gap-3">
      <ShuffleBtn />
      <PreviousBtn />
      <PlayPauseBtn />
      <NextBtn />
      <RepeatBtn />
    </div>
    <ProgressBar />
  </div>
);

export default Control;
