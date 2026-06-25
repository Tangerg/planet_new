// ============================================================
// PlayerBar — dark transport bar (driven by kernel playback state)
// Single-row layout (Listen1/QQ-style): identity · transport · inline scrubber
// with always-visible times · utilities. Dark to match the app shell.
// ============================================================
import React, { useState, useRef, useEffect } from "react";
import { Slider } from "../components/Slider";
import { Icon, Art, fmt } from "./primitives";

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
  const [volOpen, setVolOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const scrubTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(scrubTimer.current), []);

  const pos = scrub ?? Math.min(positionSec, dur);

  const txtBtn: React.CSSProperties = {
    fontFamily: "var(--mono)",
    fontSize: 10.5,
    letterSpacing: ".12em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,.6)",
    background: "none",
    border: 0,
    cursor: "pointer",
    padding: "6px 6px",
  };
  const ctlBtn = (on: boolean): React.CSSProperties => ({
    appearance: "none",
    border: 0,
    background: "none",
    cursor: "pointer",
    padding: 5,
    color: on ? accent : "rgba(255,255,255,.72)",
    display: "grid",
    placeItems: "center",
  });
  // Mono time labels flanking the scrubber; fixed width so digit changes
  // (9:59 → 10:00) don't nudge the layout.
  const timeStyle: React.CSSProperties = {
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: ".04em",
    color: "rgba(255,255,255,.5)",
    flex: "0 0 auto",
    minWidth: 42,
  };

  // Open the full-screen now-playing view, measuring the cover art as the morph
  // origin so the shared-element transition flies from the bar's artwork.
  const openNowPlaying = (el: HTMLElement) => {
    const art = el.querySelector(".grain");
    const rect = (art ?? el).getBoundingClientRect();
    if (window.__MORPH) {
      window.__MORPH(rect, track?.coverSeed || 0, track?.gradient, onOpenNowPlaying, track?.image);
    } else {
      onOpenNowPlaying();
    }
  };

  return (
    <div
      className="glassbar"
      style={{ color: "#fff", display: "flex", alignItems: "center", gap: 6 }}
    >
      {/* dark frosted backdrop — stable colour (no per-song tint that would
          flicker on every track change); blur lives here so it can't flicker */}
      <div
        className="glass-frost"
        aria-hidden
        style={{
          background: "rgba(13,13,17,.82)",
          borderTop: "0.5px solid rgba(255,255,255,.08)",
        }}
      />

      {/* ── left: cover + meta (cover = morph origin) ── */}
      <div
        // Children are <div>s (invalid inside <button>), so role="button" +
        // keyboard handling is the correct accessible pattern here.
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="button"
        tabIndex={0}
        aria-label="Open now playing"
        onClick={(e) => openNowPlaying(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openNowPlaying(e.currentTarget);
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
        <Art
          seed={track?.coverSeed || 0}
          grad={track?.gradient}
          image={track?.image}
          images={track?.images}
          style={{
            width: 46,
            height: 46,
            flex: "0 0 auto",
            borderRadius: 6,
            boxShadow: "0 1px 2px rgba(0,0,0,.35), 0 6px 16px -6px rgba(0,0,0,.5)",
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div
            className="truncate"
            style={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,.92)" }}
          >
            {track?.title || "—"}
          </div>
          <div
            className="truncate"
            style={{ fontSize: 12, color: "rgba(255,255,255,.5)", fontWeight: 300, marginTop: 2 }}
          >
            {onOpenArtist && track?.artistId ? (
              <button
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
              </button>
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
        <button style={ctlBtn(false)} onClick={() => onPrev && onPrev()} aria-label="Previous">
          <Icon.prev size={22} />
        </button>
        <button
          style={{
            appearance: "none",
            border: 0,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            background: "#fff",
            color: "#0c0c10",
            width: 42,
            height: 42,
            borderRadius: "50%",
            margin: "0 2px",
            boxShadow: "0 4px 14px -4px rgba(0,0,0,.6)",
          }}
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Icon.pause size={20} /> : <Icon.play size={20} />}
        </button>
        <button style={ctlBtn(false)} onClick={() => onNext && onNext()} aria-label="Next">
          <Icon.next size={22} />
        </button>
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
                background: "rgba(255,255,255,.16)",
              },
            },
            range: {
              style: {
                position: "absolute",
                height: "100%",
                borderRadius: 999,
                background: accent,
              },
            },
            thumb: {
              style: {
                display: "block",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 4px rgba(0,0,0,.55)",
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
        <button style={ctlBtn(liked)} onClick={toggleLike} aria-label="Like">
          <Icon.heart size={18} filled={liked} />
        </button>
        <button style={ctlBtn(shuffle)} onClick={() => setShuffle(!shuffle)} aria-label="Shuffle">
          <Icon.shuffle size={18} />
        </button>
        <button style={ctlBtn(repeat)} onClick={onToggleRepeat} aria-label="Repeat">
          <Icon.loop size={18} />
        </button>
        {/* volume */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setVolOpen(true)}
          onMouseLeave={() => setVolOpen(false)}
        >
          <button
            style={{ ...ctlBtn(false), opacity: volume === 0 ? 0.4 : 1 }}
            aria-label="Volume"
            onClick={() => onVolume(volume > 0 ? 0 : 80)}
          >
            <Icon.volume size={18} />
          </button>
          {/* Outer layer = positioning + a transparent hover-bridge (paddingBottom)
              that reaches down to the button, so moving the cursor up to the panel
              never crosses a dead gap that dismisses it. Inner = the dark glass panel. */}
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: `translateX(-50%) translateY(${volOpen ? 0 : 6}px)`,
              paddingBottom: 12,
              opacity: volOpen ? 1 : 0,
              pointerEvents: volOpen ? "auto" : "none",
              transition: "opacity .2s ease, transform .2s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                padding: "15px 13px 13px",
                background: "rgba(16,16,20,.92)",
                border: "0.5px solid rgba(255,255,255,.1)",
                borderRadius: 14,
                WebkitBackdropFilter: "blur(22px) saturate(160%)",
                backdropFilter: "blur(22px) saturate(160%)",
                boxShadow: "0 18px 44px -14px rgba(0,0,0,.65)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9.5,
                  letterSpacing: ".1em",
                  color: "rgba(255,255,255,.55)",
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
                      background: "rgba(255,255,255,.18)",
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
                      boxShadow: `0 0 0 2px ${accent}, 0 1px 3px rgba(0,0,0,.45)`,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
        <button style={txtBtn} onClick={onOpenLyrics} aria-label="Lyrics">
          LRC
        </button>
        <button
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
        </button>
        <button style={ctlBtn(false)} onClick={onOpenComments} aria-label="Comments">
          <Icon.comment size={18} />
        </button>
      </div>
    </div>
  );
});
