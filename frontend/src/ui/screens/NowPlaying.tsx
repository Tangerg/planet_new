import React from "react";
import { motion } from "motion/react";
import type { ArtistRef, VibeComment, VibeTrack } from "@/model/vibe";
import { Art, artBg, artPair } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { FadeIn, NpSwap } from "@/components/motion";
import { Button } from "@/components/controls/Button";
import { ArtistLinks } from "@/components/cards/ArtistLink";
import { Marquee } from "@/components/Marquee";
import { CommentList } from "@/components/CommentList";
import { LyricsPanel } from "@/components/now-playing/LyricsPanel";
import { ModeTag } from "@/components/now-playing/ModeTag";
import { TagStack } from "@/components/now-playing/TagStack";
import { UpNextHandle } from "@/components/now-playing/UpNextHandle";
import { UpNextSheet } from "@/components/now-playing/UpNextSheet";
import { useTranslation } from "react-i18next";
import type { Lyric } from "@contexts/playback";
import { useNowPlayingModel } from "@/hooks/useNowPlayingModel";
import { nowPlayingTrackModel } from "@/model/now-playing";

type Props = {
  track?: VibeTrack;
  accent: string;
  liked: boolean;
  toggleLike: () => void;
  lyrics: readonly Lyric[];
  comments?: VibeComment[];
  onClose: () => void;
  onOpenStage?: () => void;
  mono?: boolean;
  initialMode?: string;
  queue?: VibeTrack[];
  onPlay?: (t: VibeTrack) => void;
  current?: VibeTrack;
  onNext?: () => void;
  onPrev?: () => void;
  onRemoveFromQueue?: (track: VibeTrack) => void;
  onClearQueue?: () => void;
  onOpenArtist?: (artist: ArtistRef) => void;
};

export const NowPlaying = React.memo(function NowPlaying({
  track,
  accent,
  liked,
  toggleLike,
  lyrics,
  comments = [],
  onClose,
  onOpenStage,
  mono = true,
  initialMode = "cover",
  queue = [],
  onPlay,
  onNext,
  onPrev,
  onRemoveFromQueue,
  onClearQueue,
  onOpenArtist,
}: Props) {
  const { t } = useTranslation();
  const {
    mode,
    setMode,
    queueOpen,
    setQueueOpen,
    lyricsMode,
    commentsMode,
    panelOpen,
    rootRef,
    queueScrollRef,
    touchHandlers,
  } = useNowPlayingModel({ initialMode, onNext, onPrev });

  const trackModel = nowPlayingTrackModel(track, {
    producedBy: (name) => t("player.producedBy", { name }),
    writtenBy: (name) => t("player.writtenBy", { name }),
  });
  const [a, b] = artPair(trackModel.coverSeed, trackModel.gradient);
  const NP_EASE = "cubic-bezier(.16,1,.3,1)";
  const NP_PANEL_TRANSITION = `transform .42s ${NP_EASE}, opacity .28s ease`;

  return (
    <FadeIn
      ref={rootRef}
      className="relative h-full overflow-hidden bg-[#08080b]"
      {...touchHandlers}
    >
      {/* enter the fullscreen visualiser stage */}
      {onOpenStage && (
        <Button
          onClick={onOpenStage}
          aria-label={t("common.visualizer")}
          className="absolute right-[92px] top-[18px] z-30 p-1 text-white/70"
        >
          <Icon.bars size={20} />
        </Button>
      )}

      {/* close */}
      <Button
        onClick={onClose}
        aria-label={t("common.close")}
        className="absolute right-14 top-[18px] z-30 p-1 text-white/70"
      >
        <Icon.close size={20} />
      </Button>

      {/* full-bleed hero: one atmospheric stage, not a split functional panel. */}
      <Art
        seed={trackModel.coverSeed}
        grad={trackModel.gradient}
        image={trackModel.image}
        images={trackModel.images}
        mono={mono}
        style={{ position: "absolute", inset: 0, height: "100%" }}
      >
        <div
          className="absolute inset-0 z-[2]"
          style={{
            background:
              "radial-gradient(70% 70% at 28% 54%, rgba(255,255,255,.02), transparent 34%, rgba(6,6,9,.34) 62%, rgba(6,6,9,.68) 100%), linear-gradient(90deg, rgba(6,6,9,.12), rgba(6,6,9,.62))",
          }}
        />
        <TagStack
          accent={accent}
          liked={liked}
          toggleLike={toggleLike}
          extra={
            <>
              <ModeTag active={mode === "cover"} onClick={() => setMode("cover")}>
                {t("common.cover")}
              </ModeTag>
              <ModeTag active={lyricsMode} onClick={() => setMode("lyrics")}>
                {t("common.lyrics")}
              </ModeTag>
              <ModeTag active={commentsMode} onClick={() => setMode("comments")}>
                {t("common.comments")}
              </ModeTag>
              {trackModel.quality && (
                <span className="mlabel bg-[rgba(6,6,9,.72)] px-[12px] py-[7px] text-[9px] text-white/70">
                  {trackModel.quality}
                </span>
              )}
            </>
          }
        />
        <div className="absolute bottom-[44px] left-12 z-[6] max-w-[min(46%,540px)]">
          <Marquee className="text-[30px] font-light tracking-[0.02em]">{trackModel.title}</Marquee>
          <Marquee className="mt-0.5 text-[16px] font-light text-white/60">
            <ArtistLinks
              artists={trackModel.artists}
              fallback={trackModel.artist}
              fallbackId={trackModel.artistId}
              accent={accent}
              color="rgba(255,255,255,.6)"
              onOpenArtist={onOpenArtist}
            />
          </Marquee>
          {trackModel.creditsLabel && (
            <div className="mlabel mt-[7px] text-[10px] text-white/40">
              {trackModel.creditsLabel}
            </div>
          )}
        </div>
      </Art>

      {/* rotating disc — centered in cover mode, glides into the left half for lyrics / comments */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: panelOpen ? "25%" : "50%",
          width: 300,
          height: 300,
          marginLeft: -150,
          marginTop: -150,
          zIndex: 4,
          transform: `scale(${panelOpen ? 0.86 : 1})`,
          transformOrigin: "center",
          transition: `left .42s ${NP_EASE}, transform .42s ${NP_EASE}`,
        }}
      >
        <motion.div
          className="grain"
          data-hero="1"
          style={{
            width: 300,
            height: 300,
            borderRadius: "50%",
            overflow: "hidden",
            position: "relative",
            background: artBg(trackModel.coverSeed + 1, trackModel.gradient),
            boxShadow: `0 0 90px -10px ${b}, 0 30px 80px rgba(0,0,0,.5)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 26, ease: "linear", repeat: Infinity }}
        >
          {trackModel.image && (
            <img
              src={trackModel.image}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {/* vinyl centre — subtle spindle detail */}
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 -ml-[30px] -mt-[30px] h-[60px] w-[60px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(0,0,0,.5), rgba(0,0,0,.18) 60%, transparent 72%)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)",
            }}
          />
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 rounded-full bg-white/[0.16]"
          />
        </motion.div>
      </div>

      {/* lyrics/comments reading layer: transparent over the same image stage. */}
      <div
        aria-hidden={!panelOpen}
        className="absolute right-0 top-0 z-[5] h-full w-[56%] overflow-hidden"
        style={{
          transform: panelOpen ? "translateX(0)" : "translateX(100%)",
          opacity: panelOpen ? 1 : 0,
          pointerEvents: panelOpen ? "auto" : "none",
          transition: NP_PANEL_TRANSITION,
        }}
      >
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(10,11,13,.16) 22%, rgba(10,11,13,.46) 58%, rgba(10,11,13,.58) 100%)",
            backdropFilter: "blur(22px) saturate(112%)",
            WebkitBackdropFilter: "blur(22px) saturate(112%)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0%, rgba(0,0,0,.18) 14%, rgba(0,0,0,.72) 34%, #000 54%)",
            maskImage:
              "linear-gradient(90deg, transparent 0%, rgba(0,0,0,.18) 14%, rgba(0,0,0,.72) 34%, #000 54%)",
          }}
        />
        <NpSwap key={mode} className="relative z-[2] h-full">
          {commentsMode ? (
            <div className="scroll h-full px-[12%] pb-10 pt-[80px]">
              <div
                className="mb-[28px] inline-block bg-[rgba(6,6,9,.82)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em]"
                style={{ color: accent }}
              >
                {t("comments.title")}
              </div>
              <CommentList comments={comments} />
            </div>
          ) : (
            <LyricsPanel lyrics={lyrics} noLyricsText={t("player.noLyrics")} accent={accent} />
          )}
        </NpSwap>
      </div>

      {!queueOpen && <UpNextHandle count={queue.length} onOpen={() => setQueueOpen(true)} />}

      <UpNextSheet
        open={queueOpen}
        onOpenChange={setQueueOpen}
        container={rootRef.current}
        contentRef={queueScrollRef}
        track={track}
        queue={queue}
        accent={accent}
        tintA={a}
        grad={trackModel.gradient}
        onPlay={onPlay}
        onRemoveFromQueue={onRemoveFromQueue}
        onClearQueue={onClearQueue}
        onOpenArtist={onOpenArtist}
      />
    </FadeIn>
  );
});
