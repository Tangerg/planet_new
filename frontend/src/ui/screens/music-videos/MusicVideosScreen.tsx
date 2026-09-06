import type { VibeMusicVideo } from "@/model/vibe";
import { useTranslation } from "react-i18next";
import { CardRail } from "@/components/layout/CardRail";
import { Empty } from "@/components/layout/Empty";
import { PageColumn } from "@/components/layout/PageColumn";
import { ScreenScaffold } from "@/components/layout/ScreenScaffold";
import { SectionHead } from "@/components/layout/SectionHead";
import { musicVideosScreenModel } from "@/model/music-video-screen";
import { localize } from "@/i18n/text";
import { useSourceName } from "@/hooks/useSourceName";

import { FeaturedVideoBanner } from "./FeaturedVideoBanner";
import { VideoMeta } from "./VideoMeta";
import { VideoThumb } from "./VideoThumb";
import { useAccent } from "@/hooks/accent";

type MusicVideosScreenProps = {
  videos: VibeMusicVideo[];
  isLoading: boolean;
  onOpenVideo: (video: VibeMusicVideo, related?: VibeMusicVideo[]) => void;
};

export function MusicVideosScreen({ videos, isLoading, onOpenVideo }: MusicVideosScreenProps) {
  const accent = useAccent();
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
            <FeaturedVideoBanner video={featured} onOpen={() => onOpenVideo(featured, related)} />

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
                    return <VideoThumb video={mv} onOpen={() => onOpenVideo(mv, related)} />;
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
