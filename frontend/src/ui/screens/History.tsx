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
  const { t } = useTranslation();
  const model = historyScreenModel(session, weekRecord, all);
  const { hero, total } = model;
  const Group = ({ section }: { section: HistorySection }) => (
    <div className="mb-9">
      <SectionHead title={t(section.labelKey)} style={{ marginBottom: 6 }} />
      {section.items.map((t, i) => (
        <TrackRow
          key={section.labelKey + t.id + i}
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
  );

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
            <Group key={section.labelKey} section={section} />
          ))}
          {model.isEmpty && <Empty className="p-[50px]">{t("history.empty")}</Empty>}
        </PageColumn>
      </div>
    </FadeIn>
  );
}
