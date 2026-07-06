// ============================================================
// PlayerBar — dark transport bar (driven by kernel playback state)
// Single-row layout (Listen1/QQ-style): identity · transport · inline scrubber
// with always-visible times · utilities. Dark to match the app shell.
// ============================================================
import React from "react";
import "./PlayerBar.css";
import type { ArtistRef, VibeTrack } from "@/model/vibe";
import { PlayerTrackIdentity } from "@/components/player-bar/PlayerTrackIdentity";
import { PlayerScrubber } from "@/components/player-bar/PlayerScrubber";
import { PlayerUtilities } from "@/components/player-bar/PlayerUtilities";
import { TransportControls } from "@/components/player-bar/TransportControls";
import { useMorph } from "@/infra/morph";
import { artPair } from "@/components/primitives";
import { BreathingLight } from "@/components/visualizer/BreathingLight";

type Props = {
  track?: VibeTrack;
  playing: boolean;
  onTogglePlay: () => void;
  liked: boolean;
  toggleLike: () => void;
  accent: string;
  onOpenNowPlaying: () => void;
  onOpenLyrics: () => void;
  onOpenQueue: () => void;
  onOpenComments: () => void;
  shuffle: boolean;
  onToggleShuffle: () => void;
  repeat: boolean;
  /** Whether repeat mode is single-track (renders the repeat-one glyph). */
  repeatOne: boolean;
  onToggleRepeat: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  /** Real playback progress / total, in seconds (from the kernel). */
  positionSec: number;
  durationSec: number;
  /** Seek to a 0..100 percent of the track. */
  onSeek: (pct: number) => void;
  /** Volume on the kernel's 0..100 scale, with its setter. */
  volume: number;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
  onOpenArtist?: (artist: ArtistRef) => void;
};

export const PlayerBar = React.memo(function PlayerBar({
  track,
  playing,
  onTogglePlay,
  liked,
  toggleLike,
  accent,
  onOpenNowPlaying,
  onOpenLyrics,
  onOpenQueue,
  onOpenComments,
  shuffle,
  onToggleShuffle,
  repeat,
  repeatOne,
  onToggleRepeat,
  onNext,
  onPrev,
  positionSec,
  durationSec,
  onSeek,
  volume,
  onVolume,
  onToggleMute,
  onOpenArtist,
}: Props) {
  const morph = useMorph();

  const [a, b] = artPair(track?.coverSeed || 0, track?.gradient);

  // Open the full-screen now-playing view, measuring the cover art as the morph
  // origin so the shared-element transition flies from the bar's artwork.
  const openNowPlaying = (el: HTMLElement) => {
    const art = el.querySelector(".grain");
    const rect = (art ?? el).getBoundingClientRect();
    morph(rect, track?.coverSeed || 0, track?.gradient, onOpenNowPlaying, track?.image);
  };

  return (
    <div className="glassbar gap-1.5" style={{ color: "#141418" }}>
      {/* bounded frosted backdrop — blur lives here so it can't flicker */}
      <div
        className="glass-frost"
        aria-hidden
        style={{
          background: `linear-gradient(120deg, ${a}38, ${b}38), rgba(247,246,244,.62)`,
          borderTop: "0.5px solid rgba(255,255,255,.5)",
        }}
      />

      <BreathingLight playing={playing && !!track?.playUrl} accent={accent} tintA={a} tintB={b} />

      <PlayerTrackIdentity
        track={track}
        accent={accent}
        onOpenNowPlaying={openNowPlaying}
        onOpenArtist={onOpenArtist}
      />

      <TransportControls
        playing={playing}
        onTogglePlay={onTogglePlay}
        accent={accent}
        onNext={onNext}
        onPrev={onPrev}
      />

      <PlayerScrubber
        positionSec={positionSec}
        durationSec={durationSec}
        fallbackDurationSec={track?.durSec}
        accent={accent}
        onSeek={onSeek}
      />

      <PlayerUtilities
        liked={liked}
        toggleLike={toggleLike}
        shuffle={shuffle}
        onToggleShuffle={onToggleShuffle}
        repeat={repeat}
        repeatOne={repeatOne}
        onToggleRepeat={onToggleRepeat}
        volume={volume}
        onVolume={onVolume}
        onToggleMute={onToggleMute}
        accent={accent}
        tintA={a}
        tintB={b}
        onOpenLyrics={onOpenLyrics}
        onOpenQueue={onOpenQueue}
        onOpenComments={onOpenComments}
      />
    </div>
  );
});
