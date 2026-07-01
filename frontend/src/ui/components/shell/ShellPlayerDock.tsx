import { AnimatePresence, motion } from "motion/react";

import type { ArtistRef, VibeTrack } from "@/model/adapt";
import { PlayerBar } from "@/components/PlayerBar";
import { usePlaybackProgress } from "@/hooks/usePlaybackProgress";

type Props = {
  show: boolean;
  track?: VibeTrack;
  playing: boolean;
  setPlaying: (value: boolean) => void;
  liked: boolean;
  toggleLike: () => void;
  accent: string;
  shuffle: boolean;
  setShuffle: (value: boolean) => void;
  repeat: boolean;
  repeatOne: boolean;
  onToggleRepeat: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (percent: number) => void;
  volume: number;
  onVolume: (volume: number) => void;
  onOpenNowPlaying: () => void;
  onOpenQueue: () => void;
  onOpenComments: () => void;
  onOpenLyrics: () => void;
  onOpenArtist: (artist: ArtistRef) => void;
};

export function ShellPlayerDock({
  show,
  track,
  playing,
  setPlaying,
  liked,
  toggleLike,
  accent,
  shuffle,
  setShuffle,
  repeat,
  repeatOne,
  onToggleRepeat,
  onNext,
  onPrev,
  onSeek,
  volume,
  onVolume,
  onOpenNowPlaying,
  onOpenQueue,
  onOpenComments,
  onOpenLyrics,
  onOpenArtist,
}: Props) {
  // Subscribe to the frequent progress tick here, not in Shell — only this dock
  // (and Now Playing) re-render as the clock advances.
  const { positionSec, durationSec } = usePlaybackProgress();
  return (
    <>
      <div aria-hidden style={{ flex: `0 0 ${show ? 84 : 0}px` }} />

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ y: "108%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "108%", opacity: 0 }}
            transition={{
              y: { duration: 0.44, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.3 },
            }}
            className="absolute inset-x-0 bottom-0 z-30 overflow-visible will-change-transform"
          >
            <PlayerBar
              track={track}
              playing={playing}
              setPlaying={setPlaying}
              liked={liked}
              toggleLike={toggleLike}
              accent={accent}
              shuffle={shuffle}
              setShuffle={setShuffle}
              repeat={repeat}
              repeatOne={repeatOne}
              onToggleRepeat={onToggleRepeat}
              onNext={onNext}
              onPrev={onPrev}
              positionSec={positionSec}
              durationSec={durationSec}
              onSeek={onSeek}
              volume={volume}
              onVolume={onVolume}
              onOpenNowPlaying={onOpenNowPlaying}
              onOpenQueue={onOpenQueue}
              onOpenComments={onOpenComments}
              onOpenLyrics={onOpenLyrics}
              onOpenArtist={onOpenArtist}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
