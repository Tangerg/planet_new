// ============================================================
// PlayerBar — dark transport bar (driven by kernel playback state)
// Single-row layout (Listen1/QQ-style): identity · transport · inline scrubber
// with always-visible times · utilities. Dark to match the app shell.
// ============================================================
import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import * as HoverCard from "@radix-ui/react-hover-card";
import { Slider } from "../components/Slider";
import { Button } from "../components/Button";
import { Icon, Art, artPair, fmt } from "./primitives";

type Props = {
  track: any;
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
  // Real duration from the kernel (the loaded audio); track metadata is the
  // pre-load fallback so the bar has a sane scale before `durationchange`.
  const dur = durationSec > 0 ? durationSec : track?.durSec || 1;
  // While scrubbing, show the dragged seconds; commit the seek on release so
  // the audio isn't hammered every frame of the drag.
  const [scrub, setScrub] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const scrubTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(scrubTimer.current), []);

  const [a, b] = artPair(track?.coverSeed || 0, track?.gradient);
  const pos = scrub ?? Math.min(positionSec, dur);

  const txtBtn: React.CSSProperties = {
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: ".12em",
    textTransform: "uppercase",
    color: "rgba(20,20,24,.62)",
    background: "none",
    border: 0,
    cursor: "pointer",
    padding: "6px 2px",
    borderBottom: "1.5px solid rgba(20,20,24,.35)",
  };
  const ctlBtn = (on: boolean): React.CSSProperties => ({
    appearance: "none",
    border: 0,
    background: "none",
    cursor: "pointer",
    padding: 5,
    color: on ? accent : "rgba(20,20,24,.78)",
    display: "grid",
    placeItems: "center",
  });
  // Mono time labels flanking the scrubber; fixed width so digit changes
  // (9:59 → 10:00) don't nudge the layout.
  const timeStyle: React.CSSProperties = {
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: ".04em",
    color: "rgba(20,20,24,.5)",
    flex: "0 0 auto",
    minWidth: 42,
  };

  // SPIKE: open now-playing via Motion's shared-element layout (the cover and
  // the np disc share `layoutId`), so no grain-tile __MORPH measuring here —
  // just navigate and let Motion fly the cover.
  const openNowPlaying = () => onOpenNowPlaying();

  return (
    <div
      className="glassbar"
      style={{ color: "#141418", display: "flex", alignItems: "center", gap: 6 }}
    >
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
        onClick={() => openNowPlaying()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openNowPlaying();
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          paddingLeft: 18,
          paddingRight: 6,
          minWidth: 0,
          flex: "0 0 auto",
          width: 224,
          cursor: "pointer",
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.div
          layoutId="np-morph-cover"
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: 54,
            height: 54,
            flex: "0 0 auto",
            // Percent (not px) so it tweens cleanly against the disc's "50%"
            // (Motion can't interpolate px↔%); % also scales with the box, so
            // the corners round progressively during the fly, not all at the end.
            borderRadius: "8%",
            overflow: "hidden",
            boxShadow: "0 1px 2px rgba(0,0,0,.25), 0 6px 16px -4px rgba(0,0,0,.35)",
          }}
        >
          <Art
            seed={track?.coverSeed || 0}
            grad={track?.gradient}
            image={track?.image}
            images={track?.images}
            style={{ width: "100%", height: "100%" }}
          />
        </motion.div>
        <div style={{ minWidth: 0 }}>
          <div className="truncate" style={{ fontSize: 16, fontWeight: 400 }}>
            {track?.title || "—"}
          </div>
          <div
            className="truncate"
            style={{ fontSize: 13, color: "rgba(20,20,24,.55)", fontWeight: 300 }}
          >
            {onOpenArtist && track?.artistId ? (
              <Button
                style={{
                  cursor: "pointer",
                  background: "none",
                  border: 0,
                  padding: 0,
                  font: "inherit",
                  color: "inherit",
                  textAlign: "left",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenArtist({ id: track.artistId, name: track.artist });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenArtist({ id: track.artistId, name: track.artist });
                  }
                }}
              >
                {track?.artist || ""}
              </Button>
            ) : (
              track?.artist || ""
            )}
          </div>
        </div>
      </div>

      {/* ── transport (left-aligned; white play button is the focal point) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          flex: "0 0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Button style={ctlBtn(false)} onClick={() => onPrev && onPrev()} aria-label="Previous">
          <Icon.prev size={21} />
        </Button>
        <Button
          style={{
            appearance: "none",
            border: 0,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            background: accent,
            color: "#06060a",
            width: 44,
            height: 44,
            borderRadius: "50%",
            margin: "0 2px",
            boxShadow: `0 6px 18px -4px ${accent}`,
          }}
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Icon.pause size={22} /> : <Icon.play size={22} />}
        </Button>
        <Button style={ctlBtn(false)} onClick={() => onNext && onNext()} aria-label="Next">
          <Icon.next size={21} />
        </Button>
      </div>

      {/* ── inline scrubber: current time · slider · total time (always shown) ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 14px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <span style={{ ...timeStyle, textAlign: "right" }}>{fmt(Math.round(pos))}</span>
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
        <span style={{ ...timeStyle, textAlign: "left" }}>{fmt(Math.round(dur))}</span>
      </div>

      {/* ── right: utilities ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          paddingRight: 18,
          flex: "0 0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Button style={ctlBtn(liked)} onClick={toggleLike} aria-label="Like">
          <Icon.heart size={18} filled={liked} />
        </Button>
        <Button style={ctlBtn(shuffle)} onClick={() => setShuffle(!shuffle)} aria-label="Shuffle">
          <Icon.shuffle size={18} />
        </Button>
        <Button style={ctlBtn(repeat)} onClick={onToggleRepeat} aria-label="Repeat">
          <Icon.loop size={18} />
        </Button>
        {/* volume — Radix HoverCard owns the hover-open + the trigger→content
            safe area, so there's no hand-rolled hover-bridge / dead-zone. */}
        <HoverCard.Root openDelay={0} closeDelay={120}>
          <HoverCard.Trigger asChild>
            <Button
              style={{ ...ctlBtn(false), opacity: volume === 0 ? 0.4 : 1 }}
              aria-label="Volume"
              onClick={() => onVolume(volume > 0 ? 0 : 80)}
            >
              <Icon.volume size={18} />
            </Button>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              side="top"
              align="center"
              sideOffset={12}
              className="volpop"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                padding: "15px 13px 13px",
                zIndex: 9000,
                // Same frosted material as the bar (tint + base + blur) so the
                // popup reads as part of the control bar, not a foreign surface.
                background: `linear-gradient(120deg, ${a}38, ${b}38), rgba(247,246,244,.86)`,
                border: "0.5px solid rgba(255,255,255,.6)",
                borderRadius: 14,
                WebkitBackdropFilter: "blur(22px) saturate(180%)",
                backdropFilter: "blur(22px) saturate(180%)",
                boxShadow: "0 16px 38px -14px rgba(0,0,0,.32)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9.5,
                  letterSpacing: ".1em",
                  color: "rgba(20,20,24,.5)",
                  // Fixed footprint + tabular figures: 1–3 digits (7→71→100)
                  // never change the popup width.
                  display: "block",
                  width: 30,
                  textAlign: "center",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
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
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
        <Button style={txtBtn} onClick={onOpenLyrics} aria-label="Lyrics">
          LRC
        </Button>
        <Button
          style={ctlBtn(dragOver)}
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
            if (id && window.__ENQUEUE) window.__ENQUEUE(id);
          }}
        >
          <Icon.list size={18} />
        </Button>
        <Button style={ctlBtn(false)} onClick={onOpenComments} aria-label="Comments">
          <Icon.comment size={18} />
        </Button>
      </div>
    </div>
  );
});
