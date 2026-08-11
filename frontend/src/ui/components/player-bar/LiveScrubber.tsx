// ============================================================
// LiveScrubber — the player-bar scrubber wired to the live playback clock.
//
// The kernel pushes progress several times a second. Subscribing to that tick
// HERE, in a leaf, is deliberate: it keeps the frequent re-render local to the
// scrubber. If the bar subscribed instead (as the dock used to), the whole
// memoized PlayerBar — Marquee, transport, volume, utilities, the BreathingLight
// canvas host — would re-render several times a second, churning the main thread
// against whatever scroll / morph / Motion animation is running. Same isolation
// rule as ShellPlayerDock/NowPlaying, pushed one level deeper.
// ============================================================
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
