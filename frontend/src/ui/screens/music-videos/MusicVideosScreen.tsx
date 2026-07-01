import type { VibeMusicVideo } from "@/model/adapt";
import { artBg } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { CardRail } from "@/components/layout/CardRail";
import { Empty } from "@/components/layout/Empty";
import { PageColumn } from "@/components/layout/PageColumn";
import { ScreenScaffold } from "@/components/layout/ScreenScaffold";
import { SectionHead } from "@/components/layout/SectionHead";
import { Icon } from "@/infra/icons";

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
  const featured = videos[0];
  const rest = videos.slice(1);
  const related = videos;

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
              Netease Cloud Music
            </div>
            <div className="text-[36px] font-extralight tracking-[0.01em]">Music Videos</div>
          </div>
          {featured && <VideoMeta video={featured} />}
        </div>

        {isLoading ? (
          <Empty className="mt-20 p-[90px] text-center text-[22px]">Loading music videos...</Empty>
        ) : !featured ? (
          <Empty className="mt-20 p-[90px] text-center text-[22px]">
            No music videos from this provider yet.
          </Empty>
        ) : (
          <>
            <Button
              onClick={() => onOpenVideo(featured, related)}
              className="grain group relative mb-10 block h-[320px] w-full overflow-hidden border-0 p-0 text-left text-white"
              style={{
                background: artBg(featured.coverSeed),
                boxShadow: "0 24px 60px -24px rgba(0,0,0,.78)",
              }}
            >
              {featured.image && (
                <>
                  <img
                    src={featured.image}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 z-[1] h-full w-full scale-[1.18] object-cover opacity-58 blur-[34px] saturate-[1.14]"
                  />
                  <img
                    src={featured.image}
                    alt=""
                    aria-hidden
                    className="absolute inset-y-0 right-0 z-[2] h-full w-[58%] object-cover opacity-92"
                  />
                </>
              )}
              <div
                className="absolute inset-0 z-[3]"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(6,6,10,.9) 0%, rgba(6,6,10,.7) 43%, rgba(6,6,10,.18) 74%, rgba(6,6,10,.34) 100%)",
                }}
              />
              <div className="absolute inset-0 z-[4] flex max-w-[690px] flex-col justify-center px-14">
                <span className="tag self-start" style={{ background: accent, color: "#06060a" }}>
                  Featured MV
                </span>
                <div className="mb-[12px] mt-5 line-clamp-2 text-[46px] font-extralight leading-[1.04] tracking-[0.005em] [overflow-wrap:anywhere]">
                  {featured.title}
                </div>
                <div className="text-[17px] font-light text-white/56">{featured.artist}</div>
                {featured.description && (
                  <div className="mt-4 line-clamp-2 max-w-[520px] text-[14px] font-light leading-[1.55] text-white/52">
                    {featured.description}
                  </div>
                )}
                <div className="mt-[26px] flex items-center gap-[14px]">
                  <span className="pill-accent inline-flex items-center gap-2.5 px-[28px] py-[13px] text-[12px]">
                    <Icon.play size={15} /> Open
                  </span>
                  <VideoMeta video={featured} />
                </div>
              </div>
            </Button>

            {rest.length > 0 && (
              <section className="mb-10">
                <SectionHead title="Artist Videos" />
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
        )}
      </PageColumn>
    </ScreenScaffold>
  );
}
