// ============================================================
// PlayerBar — dark transport bar (driven by kernel playback state)
// Single-row layout (Listen1/QQ-style): identity · transport · inline scrubber
// with always-visible times · utilities. Dark to match the app shell.
// ============================================================
import React, { useState, useRef, useEffect } from "react";
import "./PlayerBar.css";
import * as HoverCard from "@radix-ui/react-hover-card";
import { AnimatePresence, motion } from "motion/react";
import type { VibeTrack } from "@/model/adapt";
import { Slider } from "@/components/controls/Slider";
import { Button } from "@/components/controls/Button";
import { Toggle } from "@/components/controls/Toggle";
import { useMorph } from "@/infra/morph";
import { useScreenActions } from "@/hooks/screenActions";
import { ArtistLink } from "@/components/cards/ArtistLink";
import { Icon, Art, artPair, fmt } from "@/components/primitives";
import { activateOnKey } from "@/lib/keys";

type Props = {
  track?: VibeTrack;
  playing: boolean;
  setPlaying: (v: boolean) => void;
  liked: boolean;
  toggleLike: () => void;
  accent: string;
  onOpenNowPlaying: () => void;
  onOpenLyrics: () => void;
  onOpenQueue: () => void;
  onOpenComments: () => void;
  shuffle: boolean;
  setShuffle: (v: boolean) => void;
  repeat: boolean;
  onToggleRepeat: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  /** Real playback progress / total, in seconds (from the kernel). */
  positionSec: number;
  durationSec: number;
  /** Seek to a 0..100 percent of the track. */
  onSeek: (pct: number) => void;
  /** Volume on the kernel's 0..100 scale, with its setter. */
  volume: number;
  onVolume: (v: number) => void;
  onOpenArtist?: (artist: { id: string; name: string }) => void;
};

export const PlayerBar = React.memo(function PlayerBar({
  track,
  playing,
  setPlaying,
  liked,
  toggleLike,
  accent,
  onOpenNowPlaying,
  onOpenLyrics,
  onOpenQueue,
  onOpenComments,
  shuffle,
  setShuffle,
  repeat,
  onToggleRepeat,
  onNext,
  onPrev,
  positionSec,
  durationSec,
  onSeek,
  volume,
  onVolume,
  onOpenArtist,
}: Props) {
  const morph = useMorph();
  const { enqueue } = useScreenActions();
  // Real duration from the kernel (the loaded audio); track metadata is the
  // pre-load fallback so the bar has a sane scale before `durationchange`.
  const dur = durationSec > 0 ? durationSec : track?.durSec || 1;
  // While scrubbing, show the dragged seconds; commit the seek on release so
  // the audio isn't hammered every frame of the drag.
  const [scrub, setScrub] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  // Controlled so AnimatePresence can play the volume popup's exit before unmount.
  const [volOpen, setVolOpen] = useState(false);
  const scrubTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(scrubTimer.current), []);

  const [a, b] = artPair(track?.coverSeed || 0, track?.gradient);
  const pos = scrub ?? Math.min(positionSec, dur);

  // Text utility button (LRC) — chrome (bg/border/cursor) comes from `.btn`.
  const txtBtnCls =
    "border-b-[1.5px] border-[rgba(20,20,24,0.35)] px-0.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[rgba(20,20,24,0.62)]";
  // Icon control button: static grid layout in the class, the on/off accent in style.
  const ctlCls = "grid place-items-center p-[5px]";
  const ctlColor = (on: boolean): React.CSSProperties => ({
    color: on ? accent : "rgba(20,20,24,.78)",
  });
  // Mono time labels flanking the scrubber; fixed width so digit changes
  // (9:59 → 10:00) don't nudge the layout.
  const timeCls =
    "min-w-[42px] flex-none font-mono text-[11px] tracking-[0.04em] text-[rgba(20,20,24,0.5)]";

  // Open the full-screen now-playing view, measuring the cover art as the morph
  // origin so the shared-element transition flies from the bar's artwork.
  const openNowPlaying = (el: HTMLElement) => {
    const art = el.querySelector(".grain");
    const rect = (art ?? el).getBoundingClientRect();
    morph(rect, track?.coverSeed || 0, track?.gradient, onOpenNowPlaying, track?.image);
  };

  return (
    <div className="glassbar gap-1.5" style={{ color: "#141418" }}>
      {/* bounded frosted backdrop — blur lives here so it can't flicker */}
      <div
        className="glass-frost"
        aria-hidden
        style={{
          background: `linear-gradient(120deg, ${a}38, ${b}38), rgba(247,246,244,.62)`,
          borderTop: "0.5px solid rgba(255,255,255,.5)",
        }}
      />

      {/* ── left: cover + meta (cover = morph origin) ── */}
      <div
        // Children are <div>s (invalid inside a native button), so role="button" +
        // keyboard handling is the correct accessible pattern here.
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="button"
        tabIndex={0}
        aria-label="Open now playing"
        onClick={(e) => openNowPlaying(e.currentTarget)}
        onKeyDown={activateOnKey<HTMLDivElement>((e) => openNowPlaying(e.currentTarget))}
        className="relative z-[1] flex w-[224px] min-w-0 flex-none cursor-pointer items-center gap-[11px] pl-[18px] pr-1.5"
      >
        <Art
          seed={track?.coverSeed || 0}
          grad={track?.gradient}
          image={track?.image}
          images={track?.images}
          className="flex-none"
          style={{
            width: 54,
            height: 54,
            boxShadow: "0 1px 2px rgba(0,0,0,.25), 0 6px 16px -4px rgba(0,0,0,.35)",
          }}
        />
        <div className="min-w-0">
          <div className="truncate text-[16px] font-normal">{track?.title || "—"}</div>
          <div className="truncate text-[13px] font-light text-[rgba(20,20,24,0.55)]">
            <ArtistLink
              name={track?.artist || ""}
              artistId={track?.artistId}
              accent={accent}
              color="rgba(20,20,24,.55)"
              onOpenArtist={onOpenArtist}
            />
          </div>
        </div>
      </div>

      {/* ── transport (left-aligned; white play button is the focal point) ── */}
      <div className="relative z-[1] flex flex-none items-center gap-1">
        <Button
          className={ctlCls}
          style={ctlColor(false)}
          onClick={() => onPrev && onPrev()}
          aria-label="Previous"
        >
          <Icon.prev size={21} />
        </Button>
        <Button
          className="mx-0.5 grid h-11 w-11 place-items-center rounded-full"
          style={{
            background: accent,
            color: "#06060a",
            boxShadow: `0 6px 18px -4px ${accent}`,
          }}
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Icon.pause size={22} /> : <Icon.play size={22} />}
        </Button>
        <Button
          className={ctlCls}
          style={ctlColor(false)}
          onClick={() => onNext && onNext()}
          aria-label="Next"
        >
          <Icon.next size={21} />
        </Button>
      </div>

      {/* ── inline scrubber: current time · slider · total time (always shown) ── */}
      <div className="relative z-[1] flex min-w-0 flex-1 items-center gap-3 px-[14px]">
        <span className={timeCls + " text-right"}>{fmt(Math.round(pos))}</span>
        <Slider
          min={0}
          max={dur}
          step={1}
          value={[pos]}
          onValueChange={([v]) => setScrub(v)}
          onValueCommit={([v]) => {
            onSeek(dur > 0 ? (v / dur) * 100 : 0);
            // Keep showing the scrub position until the kernel catches up,
            // avoiding a one-frame snap-back to the old position.
            clearTimeout(scrubTimer.current);
            scrubTimer.current = setTimeout(() => setScrub(null), 400);
          }}
          thumbLabel="Seek"
          // Flex-center the Root so Radix's abspos thumb wrapper centers on the
          // track (no magic offset); the track flows so it fills the width.
          style={{
            position: "relative",
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            height: 16,
            cursor: "pointer",
            touchAction: "none",
          }}
          parts={{
            track: {
              style: {
                position: "relative",
                flexGrow: 1,
                height: 4,
                borderRadius: 999,
                background: "rgba(20,20,24,.14)",
              },
            },
            range: {
              style: {
                position: "absolute",
                height: "100%",
                borderRadius: 999,
                background: `linear-gradient(90deg, ${accent}, ${b})`,
              },
            },
            thumb: {
              style: {
                display: "block",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: `0 0 0 2px ${accent}, 0 2px 6px rgba(0,0,0,.45)`,
              },
            },
          }}
        />
        <span className={timeCls + " text-left"}>{fmt(Math.round(dur))}</span>
      </div>

      {/* ── right: utilities ── */}
      <div className="relative z-[1] flex flex-none items-center gap-1 pr-[18px]">
        <Toggle
          className={ctlCls}
          style={ctlColor(liked)}
          pressed={liked}
          onPressedChange={() => toggleLike()}
          aria-label="Like"
        >
          <Icon.heart size={18} filled={liked} />
        </Toggle>
        <Toggle
          className={ctlCls}
          style={ctlColor(shuffle)}
          pressed={shuffle}
          onPressedChange={setShuffle}
          aria-label="Shuffle"
        >
          <Icon.shuffle size={18} />
        </Toggle>
        <Toggle
          className={ctlCls}
          style={ctlColor(repeat)}
          pressed={repeat}
          onPressedChange={() => onToggleRepeat()}
          aria-label="Repeat"
        >
          <Icon.loop size={18} />
        </Toggle>
        {/* volume — Radix HoverCard owns the hover-open + the trigger→content
            safe area, so there's no hand-rolled hover-bridge / dead-zone. */}
        <HoverCard.Root open={volOpen} onOpenChange={setVolOpen} openDelay={0} closeDelay={120}>
          <HoverCard.Trigger asChild>
            <Button
              className={ctlCls}
              style={{ ...ctlColor(false), opacity: volume === 0 ? 0.4 : 1 }}
              aria-label="Volume"
              onClick={() => onVolume(volume > 0 ? 0 : 80)}
            >
              <Icon.volume size={18} />
            </Button>
          </HoverCard.Trigger>
          <AnimatePresence>
            {volOpen && (
              <HoverCard.Portal forceMount>
                <HoverCard.Content side="top" align="center" sideOffset={12} asChild forceMount>
                  <motion.div
                    className="volpop z-[9000] flex flex-col items-center gap-3 rounded-[14px] px-[13px] pb-[13px] pt-[15px]"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      // Same frosted material as the bar (tint + base + blur) so the
                      // popup reads as part of the control bar, not a foreign surface.
                      background: `linear-gradient(120deg, ${a}38, ${b}38), rgba(247,246,244,.86)`,
                      border: "0.5px solid rgba(255,255,255,.6)",
                      WebkitBackdropFilter: "blur(22px) saturate(180%)",
                      backdropFilter: "blur(22px) saturate(180%)",
                      boxShadow: "0 16px 38px -14px rgba(0,0,0,.32)",
                    }}
                  >
                    {/* Fixed footprint + tabular figures: 1–3 digits (7→71→100)
                        never change the popup width. */}
                    <span className="block w-[30px] text-center font-mono text-[9.5px] tracking-[0.1em] text-[rgba(20,20,24,0.5)] tabular-nums">
                      {Math.round(volume)}
                    </span>
                    <Slider
                      orientation="vertical"
                      min={0}
                      max={1}
                      step={0.01}
                      value={[volume / 100]}
                      onValueChange={([v]) => onVolume(Math.round(v * 100))}
                      thumbLabel="Volume"
                      // Flex-center the Root so the thumb wrapper centers on the track;
                      // the thumb itself must NOT set transform (that would clobber
                      // Radix's own translateY(50%) main-axis positioning).
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: 12,
                        height: 96,
                        cursor: "pointer",
                        touchAction: "none",
                      }}
                      parts={{
                        track: {
                          style: {
                            position: "relative",
                            width: 4,
                            height: "100%",
                            borderRadius: 999,
                            background: "rgba(20,20,24,.16)",
                          },
                        },
                        range: {
                          style: {
                            position: "absolute",
                            left: 0,
                            right: 0,
                            background: accent,
                            borderRadius: 999,
                          },
                        },
                        thumb: {
                          style: {
                            display: "block",
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: "#fff",
                            boxShadow: `0 0 0 2px ${accent}, 0 1px 3px rgba(0,0,0,.35)`,
                          },
                        },
                      }}
                    />
                  </motion.div>
                </HoverCard.Content>
              </HoverCard.Portal>
            )}
          </AnimatePresence>
        </HoverCard.Root>
        <Button className={txtBtnCls} onClick={onOpenLyrics} aria-label="Lyrics">
          LRC
        </Button>
        <Button
          className={ctlCls}
          style={ctlColor(dragOver)}
          onClick={onOpenQueue}
          aria-label="Up next"
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("text/sonance-track")) {
              e.preventDefault();
              setDragOver(true);
            }
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const id = e.dataTransfer.getData("text/sonance-track");
            if (id) enqueue(id);
          }}
        >
          <Icon.list size={18} />
        </Button>
        <Button
          className={ctlCls}
          style={ctlColor(false)}
          onClick={onOpenComments}
          aria-label="Comments"
        >
          <Icon.comment size={18} />
        </Button>
      </div>
    </div>
  );
});
