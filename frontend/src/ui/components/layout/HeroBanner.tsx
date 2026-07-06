// ============================================================
// HeroBanner — the featured playlist banner on ForYou (blurred cover fill +
// contained artwork on the right, title/description/actions on a scrim). Lifts
// gently on hover; "Open" flies the morph from the banner.
// ============================================================
import React from "react";
import { useTranslation } from "react-i18next";
import type { VibeCollection } from "@/model/vibe";
import { artBg } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { LiftCard } from "@/components/lift";
import { Button } from "@/components/controls/Button";
import { useMorphOpen } from "@/hooks/useMorphOpen";
import { collectionTrackCount } from "@/model/derive";

type HeroBannerProps = {
  playlist: VibeCollection;
  onOpen: () => void;
  onPlay?: () => void;
  accent: string;
};

export function HeroBanner({ playlist, onOpen, onPlay, accent }: HeroBannerProps) {
  const open = useMorphOpen();
  const { t } = useTranslation();
  return (
    <LiftCard
      className="grain relative mb-10 h-[320px] overflow-hidden"
      scale={1.02}
      liftY={-4}
      style={{
        background: artBg(playlist.coverSeed, playlist.gradient),
        boxShadow: "0 24px 60px -20px rgba(0,0,0,.7)",
      }}
    >
      {playlist.image && (
        <>
          <img
            src={playlist.image}
            alt=""
            aria-hidden
            className="absolute inset-0 z-[1] h-full w-full scale-[1.18] object-cover opacity-60 blur-[40px] saturate-[1.2]"
          />
          <img
            src={playlist.image}
            alt=""
            aria-hidden
            className="absolute inset-0 z-[2] h-full w-full object-contain object-right"
          />
        </>
      )}
      <div
        className="absolute inset-0 z-[3]"
        style={{
          background: `linear-gradient(90deg, rgba(6,6,10,.82) 0%, rgba(6,6,10,.45) 55%, transparent 100%)`,
        }}
      />
      <div className="absolute inset-0 z-[4] flex max-w-[640px] flex-col justify-center px-14">
        <span className="tag self-start" style={{ background: accent, color: "#06060a" }}>
          {t("forYou.featured")}
        </span>
        {/* Real playlist names run long; clamp so the fixed-height banner holds. */}
        <div className="mb-[14px] mt-4 line-clamp-2 text-[46px] font-extralight leading-[1.04] tracking-[0.005em] [overflow-wrap:anywhere]">
          {playlist.name}
        </div>
        <div className="line-clamp-2 max-w-[460px] text-[15px] font-light leading-[1.55] text-white/[0.72]">
          {playlist.description}
        </div>
        <div className="mt-[26px] flex items-center gap-[14px]">
          {onPlay && (
            <Button
              className="pill-accent inline-flex items-center gap-2.5"
              onClick={onPlay}
              style={{ fontSize: 12, padding: "13px 30px" }}
            >
              <Icon.play size={15} /> {t("common.play")}
            </Button>
          )}
          <Button
            onClick={(e) =>
              open(e, {
                seed: playlist.coverSeed,
                grad: playlist.gradient,
                image: playlist.image,
                run: onOpen,
              })
            }
            className="pill-ghost"
          >
            {t("common.open")}
          </Button>
          <span className="mlabel ml-1.5 text-white/50">
            {t("counts.tracks", { count: collectionTrackCount(playlist) })}
          </span>
        </div>
      </div>
    </LiftCard>
  );
}
