// ============================================================
// History — listening history grouped into Today (this session) / This week /
// All-time, the latter two from the account's real play record. Groups are
// small/bounded so plain rows, not windowed.
// ============================================================
import React from "react";
import { useTranslation } from "react-i18next";
import type { ArtistRef, VibeTrack } from "@/model/vibe";
import { historyScreenModel, type HistorySection } from "@/model/history-screen";
import { HeroBackdrop } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { HeroArt } from "@/components/HeroArt";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/controls/Button";
import { TrackRow } from "@/components/cards/TrackRow";
import { SectionHead } from "@/components/layout/SectionHead";
import { Empty } from "@/components/layout/Empty";
import { PageColumn } from "@/components/layout/PageColumn";
import { useAccent } from "@/hooks/accent";

type HistoryScreenProps = {
  /** This session's plays (newest last) → the "Today" group. */
  session: readonly VibeTrack[];
  /** Account play record — most played last week. */
  week: VibeTrack[];
  /** Account play record — most played all time. */
  all: VibeTrack[];
  onPlay: (track: VibeTrack) => void;
  current?: VibeTrack;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (track: VibeTrack) => void;
  onOpenArtist?: (artist: ArtistRef) => void;
};

// Module scope on purpose: declared inside HistoryScreen this would be a NEW
// component type on every render, so React would unmount and remount every group
// — throwing away each memoized TrackRow's DOM and hover state on any parent
// update (a track change, a like toggle).
type HistoryGroupProps = Pick<
  HistoryScreenProps,
  "onPlay" | "current" | "playing" | "liked" | "toggleLike" | "onOpenArtist"
> & { section: HistorySection };

function HistoryGroup({
  section,
  onPlay,
  current,
  playing,
  liked,
  toggleLike,
  onOpenArtist,
}: HistoryGroupProps) {
  const { t } = useTranslation();
  return (
    <div className="mb-9">
      <SectionHead title={t(section.labelKey)} style={{ marginBottom: 6 }} />
      {section.items.map((track, i) => (
        <TrackRow
          key={section.labelKey + track.id + i}
          track={track}
          index={i + 1}
          onPlay={onPlay}
          current={current}
          playing={playing}
          liked={liked}
          toggleLike={toggleLike}
          onOpenArtist={onOpenArtist}
        />
      ))}
    </div>
  );
}

export function HistoryScreen({
  session,
  week: weekRecord,
  all,
  onPlay,
  current,
  playing,
  liked,
  toggleLike,
  onOpenArtist,
}: HistoryScreenProps) {
  const { t } = useTranslation();
  const accent = useAccent();
  const model = historyScreenModel(session, weekRecord, all);
  const { hero, total } = model;

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
                {t("history.consumption")}
              </span>
              <div className="mb-4 mt-3 text-[56px] font-extralight leading-none tracking-[-0.015em]">
                {t("history.title")}
              </div>
              <div className="text-[14px] font-light text-white/[0.55]">
                {t("history.subtitle", { count: total })}
              </div>
              {hero && (
                <Button
                  onClick={() => onPlay(hero)}
                  className="pill-accent mt-[22px] inline-flex items-center gap-[9px] font-medium"
                  style={{ padding: "11px 22px", color: "#06060a" }}
                >
                  <Icon.play size={16} /> {t("history.resume")}
                </Button>
              )}
            </div>
          </div>
          {/* grouped lists */}
          {model.sections.map((section) => (
            <HistoryGroup
              key={section.labelKey}
              section={section}
              onPlay={onPlay}
              current={current}
              playing={playing}
              liked={liked}
              toggleLike={toggleLike}
              onOpenArtist={onOpenArtist}
            />
          ))}
          {model.isEmpty && <Empty className="p-[50px]">{t("history.empty")}</Empty>}
        </PageColumn>
      </div>
    </FadeIn>
  );
}
