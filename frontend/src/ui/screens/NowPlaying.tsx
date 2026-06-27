import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { VirtualList } from "@/components/layout/VirtualList";
import type { VibeTrack } from "@/model/adapt";
import { Icon, Equalizer, Art, artBg, artPair } from "@/components/primitives";
import { FadeIn, NpSwap } from "@/components/motion";
import { Button } from "@/components/controls/Button";
import { Sheet } from "@/components/Sheet";
import { ArtistLink } from "@/components/cards/ArtistLink";
import { useScreenActions } from "@/hooks/screenActions";
import { useTranslation } from "react-i18next";
import { activateOnKey } from "@/lib/keys";

// A synced-lyric line: text + optional timestamp (ms). The "No lyrics" fallback
// line carries no `t`.
export type LyricLine = { line: string; t?: number };

// ============================================================
// NowPlaying — full-bleed cover  ·  Lyrics  (toggle)
// ============================================================
function LyricLines({
  lines,
  accent,
  active,
  scrollRef,
}: {
  lines: LyricLine[];
  accent: string;
  active: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  // Auto-scroll the active line into view (centered) inside the fixed-height container.
  useEffect(() => {
    const container = scrollRef.current;
    const el = container?.querySelector<HTMLElement>(`[data-lyric-idx="${active}"]`);
    if (!el || !container) return;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const top =
      container.scrollTop +
      (elRect.top - containerRect.top) -
      containerRect.height / 2 +
      elRect.height / 2;
    // Interrupt any in-flight smooth scroll before starting a new one
    // eslint-disable-next-line no-self-assign — reading scrollTop interrupts smooth scroll
    container.scrollTop = container.scrollTop;
    container.scrollTo({ top, behavior: "smooth" });
    return () => {
      // Halt scroll on unmount
      // eslint-disable-next-line no-self-assign — reading scrollTop interrupts smooth scroll
      container.scrollTop = container.scrollTop;
    };
  }, [active, scrollRef]);

  return (
    <div className="flex flex-col gap-[26px] px-[12%] pb-[60%] pt-[40%] text-center">
      {lines.map((l, i) => {
        const on = i === active;
        if (!l.line) return <div key={i} className="h-0.5" />;
        return (
          <div
            key={i}
            data-lyric-idx={i}
            style={{
              fontSize: on ? 26 : 21,
              fontWeight: 300,
              letterSpacing: ".01em",
              lineHeight: 1.35,
              color: on ? accent : "rgba(255,255,255,.62)",
              transition: "color .4s, font-size .4s",
              paddingBottom: on ? 14 : 0,
              borderBottom: on ? `1.5px solid ${accent}88` : "none",
            }}
          >
            {l.line}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// TagStack — floating tag stack (top-left)
// ============================================================
function TagStack({
  accent,
  liked,
  toggleLike,
  extra,
}: {
  accent: string;
  liked: boolean;
  toggleLike: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="absolute left-12 top-16 z-[6] flex flex-col items-start gap-[14px]">
      <Button
        onClick={toggleLike}
        aria-label="Like"
        className="p-0"
        style={{ color: accent, filter: `drop-shadow(0 4px 12px ${accent}88)` }}
      >
        <Icon.heart size={30} filled={liked} />
      </Button>
      {extra}
    </div>
  );
}

// ============================================================
// ModeTag — clickable pill tag (mode toggle). A native <button> (Button
// primitive) — no hand-rolled role="button"/keyboard; Enter/Space + focus ring
// come for free.
// ============================================================
function ModeTag({
  cls = "tag",
  onClick,
  children,
}: {
  cls?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button className={cls + " cursor-pointer"} onClick={onClick}>
      {children}
    </Button>
  );
}

type Props = {
  track?: VibeTrack;
  accent: string;
  liked: boolean;
  toggleLike: () => void;
  lyrics: LyricLine[];
  onClose: () => void;
  mono?: boolean;
  initialMode?: string;
  queue?: VibeTrack[];
  onPlay?: (t: VibeTrack) => void;
  current?: VibeTrack;
  onNext?: () => void;
  onPrev?: () => void;
  /** Current playback position in seconds (from the kernel). */
  progressSec?: number;
  onOpenArtist?: (artist: { id: string; name: string }) => void;
};

export const NowPlaying = React.memo(function NowPlaying({
  track,
  accent,
  liked,
  toggleLike,
  lyrics,
  onClose,
  mono = true,
  initialMode = "cover",
  queue = [],
  onPlay,
  onNext,
  onPrev,
  progressSec = 0,
  onOpenArtist,
}: Props) {
  const { trackMenu } = useScreenActions();
  const [mode, setMode] = useState(initialMode); // cover | lyrics | comments
  const [queueOpen, setQueueOpen] = useState(false); // down axis = queue
  const touch = useRef<{ x: number; y: number } | null>(null);
  const queueScrollRef = useRef<HTMLDivElement>(null);
  // Portal target for the queue Sheet — keeps it positioned within this screen.
  const rootRef = useRef<HTMLDivElement>(null);
  // Memoized so the lyric auto-advance effect below depends on a stable value
  // (the fallback array literal would otherwise be new every render).
  const lines = useMemo(
    () => (lyrics && lyrics.length ? lyrics : [{ line: "No lyrics for this track." }]),
    [lyrics],
  );
  const [active, setActive] = useState(0);
  const { t } = useTranslation();

  // Sync active lyric line to real playback progress.
  // Lyric timestamps `t` are in milliseconds; `progressSec` is in seconds.
  const lyricScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Skip when there are no timestamps (fallback "No lyrics" line has no `t`).
    if (!lines.length || typeof lines[0].t !== "number") return;
    const posMs = progressSec * 1000;
    // Find the last line whose timestamp <= current position.
    let idx = 0;
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i]?.t;
      if (typeof t === "number" && t <= posMs) idx = i;
      else break;
    }
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

      {/* full-bleed hero (portrait drop) — stays put; lyrics panel slides over its right half */}
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
            background: "radial-gradient(60% 60% at 50% 50%, transparent 0%, rgba(6,6,9,.55) 100%)",
          }}
        />
        <TagStack
          accent={accent}
          liked={liked}
          toggleLike={toggleLike}
          extra={
            mode === "cover" ? (
              <>
                <span className="tag">{track?.quality || "SQ"}</span>
                {track?.version && track.version !== "studio" && (
                  <span className="tag capitalize">{track.version}</span>
                )}
                {track?.vipOnly && <span className="pill-accent">VIP</span>}
                <ModeTag onClick={() => setMode("lyrics")}>Lyrics</ModeTag>
                <ModeTag onClick={() => setMode("comments")}>Comments</ModeTag>
              </>
            ) : (
              <>
                <ModeTag cls="pill-accent" onClick={() => setMode("cover")}>
                  Cover
                </ModeTag>
                <ModeTag onClick={() => setMode(lyricsMode ? "comments" : "lyrics")}>
                  {lyricsMode ? "Comments" : "Lyrics"}
                </ModeTag>
              </>
            )
          }
        />
        <div className="absolute bottom-[44px] left-12 z-[6] max-w-[min(46%,540px)]">
          <div className="line-clamp-2 text-[30px] font-light tracking-[0.02em] [overflow-wrap:anywhere]">
            {track?.title}
          </div>
          <div className="truncate text-[16px] font-light text-white/60">
            <ArtistLink
              name={track?.artist}
              artistId={track?.artistId}
              accent={accent}
              color="rgba(255,255,255,.6)"
              onOpenArtist={onOpenArtist}
              style={{
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            />
          </div>
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
          left: panelOpen ? "21%" : "50%",
          width: 300,
          height: 300,
          marginLeft: -150,
          marginTop: -150,
          zIndex: 4,
          transform: `scale(${panelOpen ? 0.82 : 1})`,
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

      {/* side panel — lyrics or comments — slides in from the right over a blurred tint */}
      <div
        className="absolute right-0 top-0 z-[5] h-full w-[58%] overflow-hidden"
        style={{
          transform: panelOpen ? "translateX(0)" : "translateX(100%)",
          opacity: panelOpen ? 1 : 0,
          pointerEvents: panelOpen ? "auto" : "none",
          transition: `transform .62s ${NP_EASE}, opacity .42s ease`,
          background: `linear-gradient(160deg, ${a}cc, ${b}aa)`,
        }}
      >
        <div
          className="grain absolute inset-0 z-0"
          style={{
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            background: "rgba(10,12,18,.35)",
          }}
        />
        <NpSwap key={mode} className="relative z-[2] h-full">
          {commentsMode ? (
            <div className="scroll h-full px-12 pb-10 pt-[58px]">
              <div
                className="mb-[22px] inline-block pb-3 text-[26px] font-extralight tracking-[0.06em]"
                style={{ borderBottom: `2px solid ${accent}` }}
              >
                {t("comments.title")}
              </div>
              <div className="py-[50px] font-light text-white/40">{t("comments.empty")}</div>
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

      {/* Up Next handle (bottom-center) — invites the down axis */}
      {!queueOpen && (
        <Button
          onClick={() => setQueueOpen(true)}
          aria-label="Up Next"
          className="absolute bottom-[22px] left-1/2 z-[9] flex -translate-x-1/2 items-center gap-[9px] rounded-full px-[18px] py-[9px] text-white/[0.82]"
          style={{
            background: "rgba(14,14,18,.5)",
            border: "1px solid rgba(255,255,255,.14)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.1), 0 8px 24px -10px rgba(0,0,0,.7)",
          }}
        >
          <span className="mlabel text-[10px]">Up Next · {queue.length}</span>
          <span className="grid rotate-90 place-items-center">
            <Icon.back size={14} />
          </span>
        </Button>
      )}

      {/* queue sheet — Radix Dialog (Escape / click-outside / scroll-lock), Motion slide */}
      <Sheet
        open={queueOpen}
        onOpenChange={setQueueOpen}
        container={rootRef.current}
        label="Up Next"
        contentRef={queueScrollRef}
        className="z-[22] h-[70%]"
        overlayClassName="z-[21]"
        durationSec={0.58}
        style={{
          background: `linear-gradient(180deg, ${a}26, rgba(8,8,11,.97) 20%)`,
          backdropFilter: "blur(34px)",
          WebkitBackdropFilter: "blur(34px)",
          borderTop: "1px solid rgba(255,255,255,.13)",
          boxShadow: "0 -34px 90px rgba(0,0,0,.62)",
        }}
      >
        <button
          type="button"
          aria-label="Collapse queue"
          onClick={() => setQueueOpen(false)}
          className="btn grid w-full cursor-pointer place-items-center pb-1 pt-[13px]"
        >
          <div className="h-1 w-11 rounded-sm bg-white/[0.28]"></div>
        </button>
        <div className="px-11 pb-11 pt-2">
          <div className="mb-4 flex items-baseline gap-[13px]">
            <span className="text-[24px] font-extralight tracking-[0.05em]">Up Next</span>
            <span className="mlabel text-white/40">{queue.length} tracks</span>
          </div>
          {/* now playing */}
          <div className="mb-2 flex items-center gap-[14px] border-b border-white/10 pb-[14px] pt-2.5">
            <span className="grid w-[18px] place-items-center">
              <Equalizer playing color={accent} size={15} />
            </span>
            <Art
              seed={track?.coverSeed}
              grad={grad}
              image={track?.image}
              images={track?.images}
              className="flex-none"
              style={{ width: 44, height: 44 }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px]" style={{ color: accent }}>
                {track?.title}
              </div>
              <div className="truncate text-[12.5px] font-light text-white/50">
                <ArtistLink
                  name={track?.artist}
                  artistId={track?.artistId}
                  accent={accent}
                  color="rgba(255,255,255,.5)"
                  onOpenArtist={onOpenArtist}
                  style={{
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                />
              </div>
            </div>
            <span className="mlabel text-[10px] text-white/40">Now</span>
          </div>
          {queue.length > 0 ? (
            <VirtualList
              scrollRef={queueScrollRef}
              count={queue.length}
              estimateSize={58}
              itemKey={(vi) => queue[vi].id + vi}
              renderItem={(vi) => {
                const t = queue[vi];
                return (
                  <div
                    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                    role="button"
                    tabIndex={0}
                    aria-label={t.title}
                    onClick={() => onPlay && onPlay(t)}
                    onKeyDown={activateOnKey(() => onPlay?.(t))}
                    onContextMenu={(e: React.MouseEvent) => trackMenu(e, t)}
                    className="flex cursor-pointer items-center gap-[14px] py-[9px]"
                  >
                    <span className="mlabel w-[18px] flex-none text-center text-[11px] text-white/[0.32]">
                      {vi + 1}
                    </span>
                    <Art
                      seed={t.coverSeed}
                      grad={t.gradient}
                      image={t.image}
                      images={t.images}
                      className="flex-none"
                      style={{ width: 40, height: 40 }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px]">{t.title}</div>
                      <div className="truncate text-[12px] font-light text-white/45">
                        {t.artist}
                      </div>
                    </div>
                    <span className="mlabel flex-none text-[10px] text-white/[0.32]">
                      {t.duration}
                    </span>
                  </div>
                );
              }}
            />
          ) : (
            <div className="p-[30px] font-light text-white/40">Queue is empty.</div>
          )}
        </div>
      </Sheet>
    </FadeIn>
  );
});
