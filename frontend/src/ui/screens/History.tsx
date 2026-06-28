// ============================================================
// History — listening history grouped into Today (this session) / This week /
// All-time, the latter two from the account's real play record. Groups are
// small/bounded so plain rows, not windowed.
// ============================================================
import React from "react";
import type { ArtistRef, VibeTrack } from "@/model/adapt";
import { groupHistory } from "@/model/derive";
import { Icon, HeroBackdrop } from "@/components/primitives";
import { HeroArt } from "@/components/HeroArt";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/controls/Button";
import { TrackRow } from "@/components/cards/TrackRow";
import { SectionHead } from "@/components/layout/SectionHead";
import { Empty } from "@/components/layout/Empty";
import { PageColumn } from "@/components/layout/PageColumn";

type HistoryScreenProps = {
  /** This session's plays (newest last) → the "Today" group. */
  session: VibeTrack[];
  /** Account play record — most played last week. */
  week: VibeTrack[];
  /** Account play record — most played all time. */
  all: VibeTrack[];
  onPlay: (track: VibeTrack) => void;
  current?: VibeTrack;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (id: string) => void;
  accent: string;
  onOpenArtist?: (artist: ArtistRef) => void;
};

export function HistoryScreen({
  session,
  week: weekRecord,
  all,
  onPlay,
  current,
  playing,
  liked,
  toggleLike,
  accent,
  onOpenArtist,
}: HistoryScreenProps) {
  const { today, week, earlier, total, hero } = groupHistory(session, weekRecord, all);

  const Group = ({ label, items }: { label: string; items: VibeTrack[] }) =>
    items.length ? (
      <div className="mb-9">
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
    <FadeIn className="relative h-full bg-[#0a0a0d]">
      <HeroBackdrop image={hero?.image} seed={hero?.coverSeed || 0} grad={hero?.gradient} />
      <div className="scroll relative z-[2] h-full">
        <PageColumn className="pb-[30px] pt-[70px]">
          {/* header */}
          <div className="mb-[46px] flex items-end gap-[30px]">
            <HeroArt
              seed={hero?.coverSeed || 0}
              grad={hero?.gradient}
              image={hero?.image}
              size={168}
              className="flex-none"
            />
            <div className="min-w-0 pb-1.5">
              <span className="mlabel" style={{ color: accent, letterSpacing: ".2em" }}>
                Consumption
              </span>
              <div className="mb-4 mt-3 text-[56px] font-extralight leading-none tracking-[-0.015em]">
                History
              </div>
              <div className="text-[14px] font-light text-white/[0.55]">
                Everything you've played recently · {total} tracks
              </div>
              {hero && (
                <Button
                  onClick={() => onPlay(hero)}
                  className="pill-accent mt-[22px] inline-flex items-center gap-[9px] font-medium"
                  style={{ padding: "11px 22px", color: "#06060a" }}
                >
                  <Icon.play size={16} /> Resume listening
                </Button>
              )}
            </div>
          </div>
          {/* grouped lists */}
          <Group label="Today" items={today} />
          <Group label="This week" items={week} />
          <Group label="All-time" items={earlier} />
          {!total && <Empty className="p-[50px]">Nothing played yet.</Empty>}
        </PageColumn>
      </div>
    </FadeIn>
  );
}
