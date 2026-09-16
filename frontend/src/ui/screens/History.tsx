import { useTranslation } from "react-i18next";
import type { TrackListBindings, VibeTrack } from "@/model/vibe";
import { historyScreenModel, type HistorySection } from "@/model/history-screen";
import { Icon } from "@/infra/icons";
import { HeroArt } from "@/components/HeroArt";
import { Button } from "@/components/controls/Button";
import { TrackRow } from "@/components/cards/TrackRow";
import { SectionHead } from "@/components/layout/SectionHead";
import { Empty } from "@/components/layout/Empty";
import { PageColumn } from "@/components/layout/PageColumn";
import { ScreenScaffold } from "@/components/layout/ScreenScaffold";
import { useAccent } from "@/hooks/accent";

type HistoryScreenProps = TrackListBindings & {
  session: readonly VibeTrack[];
  week: VibeTrack[];
  all: VibeTrack[];
};

type HistoryGroupProps = TrackListBindings & { section: HistorySection };

function HistoryGroup({ section, ...trackList }: HistoryGroupProps) {
  const { t } = useTranslation();
  return (
    <div className="mb-9">
      <SectionHead title={t(section.labelKey)} style={{ marginBottom: 6 }} />
      {section.items.map((track, i) => (
        <TrackRow
          key={section.labelKey + track.id + i}
          track={track}
          index={i + 1}
          {...trackList}
        />
      ))}
    </div>
  );
}

export function HistoryScreen({
  session,
  week: weekRecord,
  all,
  ...trackList
}: HistoryScreenProps) {
  const { t } = useTranslation();
  const accent = useAccent();
  const model = historyScreenModel(session, weekRecord, all);
  const { hero, total } = model;

  return (
    <ScreenScaffold
      background="#0a0a0d"
      backdrop={{ image: hero?.image, seed: hero?.coverSeed || 0, grad: hero?.gradient }}
    >
      <PageColumn className="pb-[30px] pt-[70px]">
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
                onClick={() => trackList.onPlay(hero)}
                className="pill-accent mt-[22px] inline-flex items-center gap-[9px] font-medium"
                style={{ padding: "11px 22px", color: "#06060a" }}
              >
                <Icon.play size={16} /> {t("history.resume")}
              </Button>
            )}
          </div>
        </div>
        {model.sections.map((section) => (
          <HistoryGroup key={section.labelKey} section={section} {...trackList} />
        ))}
        {model.isEmpty && <Empty className="p-[50px]">{t("history.empty")}</Empty>}
      </PageColumn>
    </ScreenScaffold>
  );
}
