// ============================================================
// Queue — "Up Next": now-playing hero on the left, windowed queue on the right.
// ============================================================
import React, { useRef } from "react";
import type { ArtistRef, VibeTrack } from "@/model/vibe";
import { HeroBackdrop } from "@/components/primitives";
import { HeroArt } from "@/components/HeroArt";
import { FadeIn } from "@/components/motion";
import { TrackRow } from "@/components/cards/TrackRow";
import { VList } from "@/components/layout/VList";
import { Empty } from "@/components/layout/Empty";
import { ScrollProvider } from "@/components/layout/ScrollContext";

type QueueScreenProps = {
  current?: VibeTrack;
  queue: VibeTrack[];
  onPlay: (track: VibeTrack) => void;
  accent: string;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (id: string) => void;
  onOpenArtist?: (artist: ArtistRef) => void;
};

export function QueueScreen({
  current,
  queue,
  onPlay,
  accent,
  playing,
  liked,
  toggleLike,
  onOpenArtist,
}: QueueScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <FadeIn
      className="relative grid h-full bg-[#0a0a0d]"
      style={{ gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)" }}
    >
      <HeroBackdrop
        image={current?.image}
        seed={current?.coverSeed || 0}
        grad={current?.gradient}
      />
      <div className="relative z-[2] flex flex-col justify-center px-12 py-[70px]">
        <span className="mlabel" style={{ color: accent }}>
          Now Playing
        </span>
        <HeroArt
          seed={current?.coverSeed || 0}
          grad={current?.gradient}
          image={current?.image}
          images={current?.images}
          size={220}
          className="mt-[22px]"
        />
        <div className="mt-[26px] line-clamp-2 max-w-full text-[30px] font-light [overflow-wrap:anywhere]">
          {current?.title}
        </div>
        <div className="max-w-full truncate text-[15px] font-light text-white/[0.55]">
          {current?.artist}
        </div>
      </div>
      <div className="scroll relative z-[2] px-6 pb-[30px] pt-16" ref={scrollRef}>
        <div className="mlabel px-[14px] pb-[14px] text-white/50">Up Next · {queue.length}</div>
        {queue.length > 0 ? (
          <ScrollProvider value={scrollRef}>
            <VList
              count={queue.length}
              estimateSize={66}
              itemKey={(vi) => queue[vi].id + vi}
              renderItem={(vi) => (
                <TrackRow
                  track={queue[vi]}
                  index={vi + 1}
                  onPlay={onPlay}
                  current={current}
                  playing={playing}
                  liked={liked}
                  toggleLike={toggleLike}
                  accent={accent}
                  onOpenArtist={onOpenArtist}
                />
              )}
            />
          </ScrollProvider>
        ) : (
          <Empty>Queue is empty.</Empty>
        )}
      </div>
    </FadeIn>
  );
}
