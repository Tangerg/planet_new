import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import type { ArtistRef, VibeComment, VibeTrack } from "@/model/adapt";
import { Art, artBg, artPair } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { FadeIn, NpSwap } from "@/components/motion";
import { Button } from "@/components/controls/Button";
import { ArtistLinks } from "@/components/cards/ArtistLink";
import { Marquee } from "@/components/Marquee";
import { CommentList } from "@/components/CommentList";
import { LyricLines } from "@/components/now-playing/LyricLines";
import { ModeTag } from "@/components/now-playing/ModeTag";
import { TagStack } from "@/components/now-playing/TagStack";
import { UpNextHandle } from "@/components/now-playing/UpNextHandle";
import { UpNextSheet } from "@/components/now-playing/UpNextSheet";
import { useTranslation } from "react-i18next";
import { activeLyricIndex, type Lyric } from "@domain/model/lyric";
import { usePlaybackProgress } from "@/hooks/usePlaybackProgress";
import { lyricLinesOrFallback } from "@/model/now-playing";

type Props = {
  track?: VibeTrack;
  accent: string;
  liked: boolean;
  toggleLike: () => void;
  lyrics: readonly Lyric[];
  comments?: VibeComment[];
  onClose: () => void;
  mono?: boolean;
  initialMode?: string;
  queue?: VibeTrack[];
  onPlay?: (t: VibeTrack) => void;
  current?: VibeTrack;
  onNext?: () => void;
  onPrev?: () => void;
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
  mono = true,
  initialMode = "cover",
  queue = [],
  onPlay,
  onNext,
  onPrev,
  onOpenArtist,
}: Props) {
  // Read the live clock here (not threaded from Shell) so only Now Playing
  // re-renders on the progress tick — see usePlaybackProgress.
  const { positionSec: progressSec } = usePlaybackProgress();
  const [mode, setMode] = useState(initialMode); // cover | lyrics | comments
  const [queueOpen, setQueueOpen] = useState(false); // down axis = queue
  const touch = useRef<{ x: number; y: number } | null>(null);
  const queueScrollRef = useRef<HTMLDivElement>(null);
  // Portal target for the queue Sheet — keeps it positioned within this screen.
  const rootRef = useRef<HTMLDivElement>(null);
  // Memoized so the lyric auto-advance effect below depends on a stable value
  // (the fallback array literal would otherwise be new every render).
  const lines = useMemo(() => lyricLinesOrFallback(lyrics), [lyrics]);
  const [active, setActive] = useState(0);
  const { t } = useTranslation();

  // Sync active lyric line to real playback progress. Lyric timestamps are in
  // milliseconds; `progressSec` is in seconds.
  const lyricScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const idx = activeLyricIndex(lines, progressSec * 1000);
    setActive((prev) => (prev === idx ? prev : idx));
  }, [progressSec, lines]);

  const [a, b] = artPair(track?.coverSeed || 0, track?.gradient);
  const coverSeed = track?.coverSeed || 0;
  const grad = track?.gradient;
  const lyricsMode = mode === "lyrics";
  const commentsMode = mode === "comments";
  const panelOpen = mode !== "cover";
  const NP_EASE = "cubic-bezier(.16,1,.3,1)";

  // axis navigation: Down = queue, Up = lyrics (capture phase wins over global spatial-nav)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setQueueOpen(true);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        if (queueOpen) setQueueOpen(false);
        else setMode((m) => (m === "lyrics" ? "cover" : "lyrics"));
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [queueOpen]);

  // TagStack and ModeTag are defined at module scope above

  return (
    <FadeIn
      ref={rootRef}
      className="relative h-full overflow-hidden bg-[#08080b]"
      onTouchStart={(e: React.TouchEvent) => {
        const t = e.touches[0];
        touch.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e: React.TouchEvent) => {
        if (!touch.current) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touch.current.x,
          dy = t.clientY - touch.current.y;
        const ax = Math.abs(dx),
          ay = Math.abs(dy);
        touch.current = null;
        if (Math.max(ax, ay) < 40) return;
        if (ax > ay) {
          if (dx < 0) onNext?.();
          else onPrev?.();
        } // left=next, right=prev
        else if (dy < 0) {
          if (queueOpen) setQueueOpen(false);
          else setMode((m) => (m === "lyrics" ? "cover" : "lyrics"));
        } // up=lyrics
        else {
          setQueueOpen(true);
        } // down=queue
      }}
    >
      {/* close */}
      <Button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-14 top-[18px] z-30 p-1 text-white/70"
      >
        <Icon.close size={20} />
      </Button>

      {/* full-bleed hero: one atmospheric stage, not a split functional panel. */}
      <Art
        seed={coverSeed}
        grad={grad}
        image={track?.image}
        images={track?.images}
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
                Cover
              </ModeTag>
              <ModeTag active={lyricsMode} onClick={() => setMode("lyrics")}>
                Lyrics
              </ModeTag>
              <ModeTag active={commentsMode} onClick={() => setMode("comments")}>
                Comments
              </ModeTag>
              {track?.quality && (
                <span className="mlabel bg-[rgba(6,6,9,.72)] px-[12px] py-[7px] text-[9px] text-white/70">
                  {track.quality}
                </span>
              )}
            </>
          }
        />
        <div className="absolute bottom-[44px] left-12 z-[6] max-w-[min(46%,540px)]">
          <Marquee className="text-[30px] font-light tracking-[0.02em]">{track?.title}</Marquee>
          <Marquee className="mt-0.5 text-[16px] font-light text-white/60">
            <ArtistLinks
              artists={track?.artists}
              fallback={track?.artist}
              fallbackId={track?.artistId}
              accent={accent}
              color="rgba(255,255,255,.6)"
              onOpenArtist={onOpenArtist}
            />
          </Marquee>
          {track?.credits && (
            <div className="mlabel mt-[7px] text-[10px] text-white/40">
              Written by {track.credits.music} · Produced by {track.credits.producer}
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
          transition: `left .62s ${NP_EASE}, transform .62s ${NP_EASE}`,
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
            background: artBg(coverSeed + 1, grad),
            boxShadow: `0 0 90px -10px ${b}, 0 30px 80px rgba(0,0,0,.5)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 26, ease: "linear", repeat: Infinity }}
        >
          {track?.image && (
            <img
              src={track.image}
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
        className="absolute right-0 top-0 z-[5] h-full w-[56%] overflow-hidden"
        style={{
          transform: panelOpen ? "translateX(0)" : "translateX(100%)",
          opacity: panelOpen ? 1 : 0,
          pointerEvents: panelOpen ? "auto" : "none",
          transition: `transform .62s ${NP_EASE}, opacity .42s ease`,
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
            <div ref={lyricScrollRef} className="scroll h-full">
              <LyricLines
                lines={lines}
                accent={accent}
                active={active}
                scrollRef={lyricScrollRef}
              />
            </div>
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
        grad={grad}
        onPlay={onPlay}
        onOpenArtist={onOpenArtist}
      />
    </FadeIn>
  );
});
