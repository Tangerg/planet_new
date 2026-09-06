// ============================================================
// FeaturedVideoBanner — the music-video hub's featured hero. Same chrome as the
// ForYou playlist banner (BannerFrame), different subject: a video's title,
// artist, blurb and open action.
// ============================================================
import React from "react";
import { useTranslation } from "react-i18next";

import {
  BannerActions,
  BannerFrame,
  BannerPrimaryAction,
  BannerTag,
  BannerTitle,
} from "@/components/layout/BannerFrame";
import type { VibeMusicVideo } from "@/model/vibe";

import { VideoMeta } from "./VideoMeta";

type FeaturedVideoBannerProps = {
  video: VibeMusicVideo;
  onOpen: () => void;
};

export function FeaturedVideoBanner({ video, onOpen }: FeaturedVideoBannerProps) {
  const { t } = useTranslation();
  return (
    <BannerFrame image={video.image} seed={video.coverSeed}>
      <BannerTag>{t("musicVideos.featured")}</BannerTag>
      <BannerTitle>{video.title}</BannerTitle>
      <div className="text-[17px] font-light text-white/[0.72]">{video.artist}</div>
      {video.description && (
        <div className="mt-3 line-clamp-2 max-w-[460px] text-[14px] font-light leading-[1.55] text-white/[0.6]">
          {video.description}
        </div>
      )}
      <BannerActions>
        <BannerPrimaryAction onClick={onOpen}>{t("common.open")}</BannerPrimaryAction>
        <VideoMeta video={video} />
      </BannerActions>
    </BannerFrame>
  );
}
