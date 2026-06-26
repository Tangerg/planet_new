// ============================================================
// Queue — "Up Next": now-playing hero on the left, windowed queue on the right.
// ============================================================
import React, { useRef } from "react";
import type { VibeTrack } from "@/model/adapt";
import { Art, artPair, HeroBackdrop } from "@/components/primitives";
import { FadeIn } from "@/components/motion";
import { TrackRow } from "@/components/cards/TrackRow";
import { VList } from "@/components/layout/VList";
import { ScrollProvider } from "@/components/layout/ScrollContext";

type QueueScreenProps = {
  current?: VibeTrack;
  queue: VibeTrack[];
  onPlay: (track: VibeTrack) => void;
  accent: string;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (id: string) => void;
  onOpenArtist?: (artist: { id: string; name: string }) => void;
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
      style={{
        height: "100%",
        position: "relative",
        display: "grid",
        gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
        background: "#0a0a0d",
      }}
    >
      <HeroBackdrop
        image={current?.image}
        seed={current?.coverSeed || 0}
        grad={current?.gradient}
      />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "70px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <span className="mlabel" style={{ color: accent }}>
          Now Playing
        </span>
        <Art
          seed={current?.coverSeed || 0}
          grad={current?.gradient}
          image={current?.image}
          images={current?.images}
          data-hero="1"
          style={{
            width: 220,
            height: 220,
            marginTop: 22,
            boxShadow: "0 30px 70px rgba(0,0,0,.55)",
          }}
          glow={artPair(current?.coverSeed || 0, current?.gradient)[1]}
        />
        <div
          style={{
            fontSize: 30,
            fontWeight: 300,
            marginTop: 26,
            maxWidth: "100%",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            overflowWrap: "anywhere",
          }}
        >
          {current?.title}
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 300,
            color: "rgba(255,255,255,.55)",
            maxWidth: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {current?.artist}
        </div>
      </div>
      <div
        className="scroll"
        ref={scrollRef}
        style={{ position: "relative", zIndex: 2, padding: "64px 24px 30px" }}
      >
        <div className="mlabel" style={{ color: "rgba(255,255,255,.5)", padding: "0 14px 14px" }}>
          Up Next · {queue.length}
        </div>
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
          <div style={{ padding: 40, color: "rgba(255,255,255,.4)", fontWeight: 300 }}>
            Queue is empty.
          </div>
        )}
      </div>
    </FadeIn>
  );
}
