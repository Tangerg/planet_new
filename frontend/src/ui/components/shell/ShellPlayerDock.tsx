import { AnimatePresence, motion } from "motion/react";

import type { ArtistRef, VibeTrack } from "@/model/vibe";
import { PlayerBar } from "@/components/PlayerBar";

type Props = {
  show: boolean;
  track?: VibeTrack;
  playing: boolean;
  onTogglePlay: () => void;
  liked: boolean;
  toggleLike: () => void;
  accent: string;
  shuffle: boolean;
  onToggleShuffle: () => void;
  repeat: boolean;
  repeatOne: boolean;
  onToggleRepeat: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (percent: number) => void;
  volume: number;
  onVolume: (volume: number) => void;
  onToggleMute: () => void;
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
  onTogglePlay,
  liked,
  toggleLike,
  accent,
  shuffle,
  onToggleShuffle,
  repeat,
  repeatOne,
  onToggleRepeat,
  onNext,
  onPrev,
  onSeek,
  volume,
  onVolume,
  onToggleMute,
  onOpenNowPlaying,
  onOpenQueue,
  onOpenComments,
  onOpenLyrics,
  onOpenArtist,
}: Props) {
  // The frequent progress tick is subscribed one level deeper, inside the bar's
  // LiveScrubber leaf — so neither this dock (nor its Motion slide wrapper) nor
  // the memoized PlayerBar re-render several times a second as the clock advances.
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
              onTogglePlay={onTogglePlay}
              liked={liked}
              toggleLike={toggleLike}
              accent={accent}
              shuffle={shuffle}
              onToggleShuffle={onToggleShuffle}
              repeat={repeat}
              repeatOne={repeatOne}
              onToggleRepeat={onToggleRepeat}
              onNext={onNext}
              onPrev={onPrev}
              onSeek={onSeek}
              volume={volume}
              onVolume={onVolume}
              onToggleMute={onToggleMute}
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
