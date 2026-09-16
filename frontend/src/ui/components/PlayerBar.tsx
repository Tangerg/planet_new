import React, { type ComponentProps } from "react";
import "./PlayerBar.css";
import type { ArtistRef, VibeTrack } from "@/model/vibe";
import { PlayerTrackIdentity } from "@/components/player-bar/PlayerTrackIdentity";
import { LiveScrubber } from "@/components/player-bar/LiveScrubber";
import { PlayerUtilities } from "@/components/player-bar/PlayerUtilities";
import { TransportControls } from "@/components/player-bar/TransportControls";
import { useMorphOpen } from "@/hooks/useMorphOpen";
import { artPair } from "@/components/primitives";
import { BreathingLight } from "@/components/visualizer/BreathingLight";

type Props = Omit<ComponentProps<typeof PlayerUtilities>, "tintA" | "tintB"> & {
  track?: VibeTrack;
  playing: boolean;
  onTogglePlay: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSeek: (pct: number) => void;
  onOpenNowPlaying: () => void;
  onOpenArtist?: (artist: ArtistRef) => void;
};

export const PlayerBar = React.memo(function PlayerBar({
  track,
  playing,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onOpenNowPlaying,
  onOpenArtist,
  ...utilities
}: Props) {
  const open = useMorphOpen();

  const [a, b] = artPair(track?.coverSeed || 0, track?.gradient);

  const openNowPlaying = (el: HTMLElement) =>
    open(
      { currentTarget: el },
      {
        seed: track?.coverSeed || 0,
        grad: track?.gradient,
        image: track?.image,
        artSelector: ".grain",
        run: onOpenNowPlaying,
      },
    );

  return (
    <div className="glassbar gap-1.5" style={{ color: "#141418" }}>
      <div
        className="glass-frost"
        aria-hidden
        style={{
          background: `linear-gradient(120deg, ${a}38, ${b}38), rgba(247,246,244,.62)`,
          borderTop: "0.5px solid rgba(255,255,255,.5)",
        }}
      />

      <BreathingLight playing={playing && !!track?.playUrl} image={track?.image} />

      <PlayerTrackIdentity
        track={track}
        onOpenNowPlaying={openNowPlaying}
        onOpenArtist={onOpenArtist}
      />

      <TransportControls
        playing={playing}
        onTogglePlay={onTogglePlay}
        onNext={onNext}
        onPrev={onPrev}
      />

      <LiveScrubber fallbackDurationSec={track?.durSec} onSeek={onSeek} />

      <PlayerUtilities {...utilities} tintA={a} tintB={b} />
    </div>
  );
});
