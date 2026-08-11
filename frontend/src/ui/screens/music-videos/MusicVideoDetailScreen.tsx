import type { ArtistRef, VibeMusicVideo } from "@/model/vibe";
import { type MusicVideoAvailabilityPolicy } from "@contexts/catalog";
import { useTranslation } from "react-i18next";
import { Art } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { CardRail } from "@/components/layout/CardRail";
import { PageColumn } from "@/components/layout/PageColumn";
import { ScreenScaffold } from "@/components/layout/ScreenScaffold";
import { SectionHead } from "@/components/layout/SectionHead";
import { localize } from "@/i18n/text";
import { Icon } from "@/infra/icons";
import { musicVideoDetailModel } from "@/model/music-video-screen";

import { VideoMeta } from "./VideoMeta";
import { VideoThumb } from "./VideoThumb";
import { useAccent } from "@/hooks/accent";

type MusicVideoDetailScreenProps = {
  video: VibeMusicVideo;
  related: VibeMusicVideo[];
  playbackPolicy: MusicVideoAvailabilityPolicy;
  onPlay: (video: VibeMusicVideo) => void;
  onOpenVideo: (video: VibeMusicVideo, related?: VibeMusicVideo[]) => void;
  onOpenArtist: (artist: ArtistRef) => void;
};

export function MusicVideoDetailScreen({
  video,
  related,
  playbackPolicy,
  onPlay,
  onOpenVideo,
  onOpenArtist,
}: MusicVideoDetailScreenProps) {
  const accent = useAccent();
  const { t } = useTranslation();
  const model = musicVideoDetailModel(video, related, playbackPolicy);
  const { artist, canPlay, commentLabel, rail } = model;

  return (
    <ScreenScaffold
      background="#0a0a0d"
      backdrop={{
        image: video.image,
        seed: video.coverSeed,
        scrim:
          "linear-gradient(180deg, rgba(10,10,13,.18) 0%, rgba(10,10,13,.58) 48%, #0a0a0d 88%)",
      }}
    >
      <PageColumn className="pb-12 pt-[88px]">
        <div
          className="grid items-end gap-[34px]"
          style={{ gridTemplateColumns: "minmax(460px, .98fr) minmax(360px, 1.02fr)" }}
        >
          <Button
            onClick={() => onPlay(video)}
            className="group relative block border-0 bg-transparent p-0 text-left"
            disabled={!canPlay}
            aria-label={t("a11y.playItem", { name: video.title })}
          >
            <Art
              seed={video.coverSeed}
              image={video.image}
              images={video.images}
              px={980}
              className="aspect-video w-full"
              style={{
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.11), 0 28px 74px -26px rgba(0,0,0,.9)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-transparent to-black/10" />
              <div
                className="absolute bottom-6 right-6 grid h-[58px] w-[58px] place-items-center transition-transform duration-200 group-hover:scale-105"
                style={{
                  borderRadius: "50%",
                  background: canPlay ? accent : "rgba(255,255,255,.16)",
                  color: canPlay ? "#06060a" : "rgba(255,255,255,.62)",
                  boxShadow: canPlay ? `0 12px 34px -10px ${accent}` : "none",
                }}
              >
                <Icon.play size={22} />
              </div>
            </Art>
          </Button>

          <div className="min-w-0 pb-2">
            {/* Plain mono kind-label, matching the Detail/Artist hero (not a boxed chip). */}
            <div className="mlabel mb-3 text-white/70">{t("common.musicVideo")}</div>
            <div className="line-clamp-2 max-w-[700px] text-[52px] font-extralight leading-[1.04] tracking-[0.005em] [overflow-wrap:anywhere]">
              {video.title}
            </div>
            <Button
              onClick={() => artist && onOpenArtist(artist)}
              disabled={!artist?.id}
              className="mt-4 block border-0 bg-transparent p-0 text-left text-[19px] font-light text-white/55"
            >
              {video.artist || t("common.unknownArtist")}
            </Button>
            {video.description && (
              <p className="mt-6 line-clamp-2 max-w-[560px] text-[14px] font-light leading-[1.6] text-white/52">
                {video.description}
              </p>
            )}
            <div className="mlabel mt-[18px] text-[10px] text-white/42">
              <VideoMeta video={video} />
            </div>
            <div className="mt-[28px] flex items-center gap-[14px]">
              <Button
                onClick={() => onPlay(video)}
                disabled={!canPlay}
                className="pill-accent inline-flex items-center gap-2.5 px-[28px] py-[13px] text-[12px]"
                style={{
                  background: canPlay ? accent : "rgba(255,255,255,.12)",
                  color: canPlay ? "#06060a" : "rgba(255,255,255,.55)",
                }}
              >
                <Icon.play size={15} /> {t("common.play")}
              </Button>
              {commentLabel ? (
                <span className="mlabel text-[10px] text-white/40">
                  {localize(t, commentLabel)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {rail.length > 0 && (
          <section className="mt-[46px]">
            <SectionHead title={t("musicVideos.artistVideos")} />
            <CardRail
              count={rail.length}
              itemWidth={224}
              gap={18}
              itemKey={(i) => rail[i].id}
              renderItem={(i) => {
                const mv = rail[i];
                return <VideoThumb video={mv} onOpen={() => onOpenVideo(mv, related)} />;
              }}
            />
          </section>
        )}
      </PageColumn>
    </ScreenScaffold>
  );
}
