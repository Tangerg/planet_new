import { PlayerScrubber } from "@/components/player-bar/PlayerScrubber";
import { usePlaybackProgress } from "@/hooks/usePlaybackProgress";

type Props = {
  fallbackDurationSec?: number;
  onSeek: (pct: number) => void;
};

export function LiveScrubber({ fallbackDurationSec, onSeek }: Props) {
  const { positionSec, durationSec } = usePlaybackProgress();
  return (
    <PlayerScrubber
      positionSec={positionSec}
      durationSec={durationSec}
      fallbackDurationSec={fallbackDurationSec}
      onSeek={onSeek}
    />
  );
}
