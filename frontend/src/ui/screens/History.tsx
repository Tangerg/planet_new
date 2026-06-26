// ============================================================
// History — listening history grouped into Today / This week / Earlier.
// Groups are small/bounded (≤14 each) so plain rows, not windowed.
// ============================================================
import React from "react";
import type { VibeTrack } from "@/model/adapt";
import { groupHistory } from "@/model/derive";
import { Icon, Art, artPair, HeroBackdrop } from "@/components/primitives";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/controls/Button";
import { TrackRow } from "@/components/cards/TrackRow";
import { SectionHead } from "@/components/layout/SectionHead";

type HistoryScreenProps = {
  history: VibeTrack[];
  all: VibeTrack[];
  onPlay: (track: VibeTrack) => void;
  current?: VibeTrack;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (id: string) => void;
  accent: string;
  onOpenArtist?: (artist: { id: string; name: string }) => void;
};

export function HistoryScreen({
  history,
  all,
  onPlay,
  current,
  playing,
  liked,
  toggleLike,
  accent,
  onOpenArtist,
}: HistoryScreenProps) {
  const { today, week, earlier, total, hero } = groupHistory(history, all, current?.coverSeed || 0);

  const Group = ({ label, items }: { label: string; items: VibeTrack[] }) =>
    items.length ? (
      <div style={{ marginBottom: 36 }}>
        <SectionHead title={label} style={{ marginBottom: 6 }} />
        {items.map((t, i) => (
          <TrackRow
            key={label + t.id + i}
            track={t}
            index={i + 1}
            onPlay={onPlay}
            current={current}
            playing={playing}
            liked={liked}
            toggleLike={toggleLike}
            accent={accent}
            onOpenArtist={onOpenArtist}
          />
        ))}
      </div>
    ) : null;

  return (
    <FadeIn style={{ height: "100%", position: "relative", background: "#0a0a0d" }}>
      <HeroBackdrop image={hero?.image} seed={hero?.coverSeed || 0} grad={hero?.gradient} />
      <div className="scroll" style={{ position: "relative", zIndex: 2, height: "100%" }}>
        <div style={{ padding: "70px 56px 30px", maxWidth: 1180, margin: "0 auto" }}>
          {/* header */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 30, marginBottom: 46 }}>
            <Art
              seed={hero?.coverSeed || 0}
              grad={hero?.gradient}
              image={hero?.image}
              data-hero="1"
              style={{
                width: 168,
                height: 168,
                flex: "0 0 auto",
                boxShadow: "0 30px 70px -18px rgba(0,0,0,.6)",
              }}
              glow={artPair(hero?.coverSeed || 0, hero?.gradient)[1]}
            />
            <div style={{ minWidth: 0, paddingBottom: 6 }}>
              <span className="mlabel" style={{ color: accent, letterSpacing: ".2em" }}>
                Consumption
              </span>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 200,
                  letterSpacing: "-.015em",
                  lineHeight: 1,
                  margin: "12px 0 16px",
                }}
              >
                History
              </div>
              <div style={{ fontSize: 14, fontWeight: 300, color: "rgba(255,255,255,.55)" }}>
                Everything you've played recently · {total} tracks
              </div>
              {hero && (
                <Button
                  onClick={() => onPlay(hero)}
                  className="pill-accent"
                  style={{
                    marginTop: 22,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 9,
                    border: 0,
                    cursor: "pointer",
                    padding: "11px 22px",
                    borderRadius: 999,
                    background: accent,
                    color: "#06060a",
                    fontWeight: 500,
                  }}
                >
                  <Icon.play size={16} /> Resume listening
                </Button>
              )}
            </div>
          </div>
          {/* grouped lists */}
          <Group label="Today" items={today} />
          <Group label="Earlier this week" items={week} />
          <Group label="Earlier" items={earlier} />
          {!total && (
            <div style={{ padding: 50, color: "rgba(255,255,255,.4)", fontWeight: 300 }}>
              Nothing played yet.
            </div>
          )}
        </div>
      </div>
    </FadeIn>
  );
}
