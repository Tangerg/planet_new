import type { VibeMusicVideo } from "@/model/vibe";
import { useTranslation } from "react-i18next";
import { artBg } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { CardRail } from "@/components/layout/CardRail";
import { Empty } from "@/components/layout/Empty";
import { PageColumn } from "@/components/layout/PageColumn";
import { ScreenScaffold } from "@/components/layout/ScreenScaffold";
import { SectionHead } from "@/components/layout/SectionHead";
import { LiftCard } from "@/components/lift";
import { Icon } from "@/infra/icons";
import { musicVideosScreenModel } from "@/model/music-video-screen";
import { localize } from "@/i18n/text";
import { useSourceName } from "@/hooks/useSourceName";

import { VideoMeta } from "./VideoMeta";
import { VideoThumb } from "./VideoThumb";

type MusicVideosScreenProps = {
  videos: VibeMusicVideo[];
  isLoading: boolean;
  accent: string;
  onOpenVideo: (video: VibeMusicVideo, related?: VibeMusicVideo[]) => void;
};

export function MusicVideosScreen({
  videos,
  isLoading,
  accent,
  onOpenVideo,
}: MusicVideosScreenProps) {
  const { t } = useTranslation();
  const sourceName = useSourceName();
  const model = musicVideosScreenModel(videos, isLoading);
  const { featured, rest, related } = model;

  return (
    <ScreenScaffold
      background="#08080b"
      backdrop={{
        image: featured?.image,
        seed: featured?.coverSeed ?? 14,
        scrim: "linear-gradient(180deg, rgba(8,8,11,.22) 0%, rgba(8,8,11,.62) 52%, #08080b 100%)",
      }}
    >
      <PageColumn className="pb-[58px] pt-[60px]">
        <div className="mb-[30px] flex items-end justify-between">
          <div>
            <div className="mlabel mb-2 text-[10px]" style={{ color: accent }}>
              {localize(t, sourceName)}
            </div>
            <div className="text-[36px] font-extralight tracking-[0.01em]">
              {t("musicVideos.title")}
            </div>
          </div>
          {featured && <VideoMeta video={featured} />}
        </div>

        {model.state === "loading" ? (
          <Empty className="mt-20 p-[90px] text-center text-[22px]">
            {t("musicVideos.loading")}
          </Empty>
        ) : model.state === "empty" ? (
          <Empty className="mt-20 p-[90px] text-center text-[22px]">{t("musicVideos.empty")}</Empty>
        ) : featured ? (
          <>
            {/* Featured hero — same treatment as the ForYou HeroBanner (blurred
                cover fill + contained frame on the right, dark left scrim, hover
                lift) so the MV hub reads as part of the system, not a one-off. */}
            <LiftCard
              className="grain relative mb-10 h-[320px] overflow-hidden"
              scale={1.02}
              liftY={-4}
              style={{
                background: artBg(featured.coverSeed),
                boxShadow: "0 24px 60px -20px rgba(0,0,0,.7)",
              }}
            >
              {featured.image && (
                <>
                  <img
                    src={featured.image}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 z-[1] h-full w-full scale-[1.18] object-cover opacity-60 blur-[40px] saturate-[1.2]"
                  />
                  <img
                    src={featured.image}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 z-[2] h-full w-full object-contain object-right"
                  />
                </>
              )}
              <div
                className="absolute inset-0 z-[3]"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(6,6,10,.82) 0%, rgba(6,6,10,.45) 55%, transparent 100%)",
                }}
              />
              <div className="absolute inset-0 z-[4] flex max-w-[640px] flex-col justify-center px-14">
                <span className="tag self-start" style={{ background: accent, color: "#06060a" }}>
                  {t("musicVideos.featured")}
                </span>
                <div className="mb-[12px] mt-4 line-clamp-2 text-[46px] font-extralight leading-[1.04] tracking-[0.005em] [overflow-wrap:anywhere]">
                  {featured.title}
                </div>
                <div className="text-[17px] font-light text-white/[0.72]">{featured.artist}</div>
                {featured.description && (
                  <div className="mt-3 line-clamp-2 max-w-[460px] text-[14px] font-light leading-[1.55] text-white/[0.6]">
                    {featured.description}
                  </div>
                )}
                <div className="mt-[26px] flex items-center gap-[14px]">
                  <Button
                    className="pill-accent inline-flex items-center gap-2.5"
                    style={{ fontSize: 12, padding: "13px 30px" }}
                    onClick={() => onOpenVideo(featured, related)}
                  >
                    <Icon.play size={15} /> {t("common.open")}
                  </Button>
                  <VideoMeta video={featured} />
                </div>
              </div>
            </LiftCard>

            {rest.length > 0 && (
              <section className="mb-10">
                <SectionHead title={t("musicVideos.artistVideos")} />
                <CardRail
                  count={rest.length}
                  itemWidth={224}
                  gap={18}
                  itemKey={(i) => rest[i].id}
                  renderItem={(i) => {
                    const mv = rest[i];
                    return (
                      <VideoThumb
                        video={mv}
                        accent={accent}
                        onOpen={() => onOpenVideo(mv, related)}
                      />
                    );
                  }}
                />
              </section>
            )}
          </>
        ) : null}
      </PageColumn>
    </ScreenScaffold>
  );
}
