// ============================================================
// PlayerBar — frosted glass transport bar (driven by kernel playback state)
// ============================================================
import React, { useState, useRef, useEffect } from "react";
import { Slider } from "../components/Slider";
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
  const barRef = useRef<HTMLSpanElement | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  // While scrubbing, show the dragged seconds; commit the seek on release so
  // the audio isn't hammered every frame of the drag.
  const [scrub, setScrub] = useState<number | null>(null);
  const [volOpen, setVolOpen] = useState(false);
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
    <div className="glassbar" style={{ color: "#141418" }}>
      {/* bounded frosted backdrop — blur lives here so it can't flicker */}
      <div
        className="glass-frost"
        aria-hidden
        style={{
          background: `linear-gradient(120deg, ${a}38, ${b}38), rgba(247,246,244,.62)`,
          borderTop: "0.5px solid rgba(255,255,255,.5)",
        }}
      />
      {/* progress line + scrubber (Radix slider: click / drag / keyboard) */}
      <Slider
        ref={barRef}
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
        onMouseMove={(e) => {
          const r = barRef.current!.getBoundingClientRect();
          setHoverX(e.clientX - r.left);
        }}
        onMouseLeave={() => setHoverX(null)}
        thumbLabel="Seek"
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, zIndex: 4 }}
        parts={{
          track: {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: "rgba(20,20,24,.12)",
            },
          },
          range: {
            style: {
              position: "absolute",
              height: "100%",
              background: `linear-gradient(90deg, ${accent}, ${b})`,
            },
          },
          thumb: {
            style: {
              display: "block",
              top: -2.5,
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: `0 0 0 2px ${accent}, 0 2px 6px rgba(0,0,0,.45)`,
              opacity: hoverX != null ? 1 : 0,
              transition: "opacity .16s",
            },
          },
        }}
      >
        {hoverX != null && (
          <div
            style={{
              position: "absolute",
              top: -34,
              left: hoverX,
              transform: "translateX(-50%)",
              background: "rgba(12,12,16,.96)",
              color: "#fff",
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: ".06em",
              padding: "4px 9px",
              borderRadius: 7,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow: "0 8px 22px -8px rgba(0,0,0,.7)",
            }}
          >
            {fmt(
              Math.round(
                Math.max(
                  0,
                  Math.min(
                    1,
                    hoverX / (barRef.current ? barRef.current.getBoundingClientRect().width : 1),
                  ),
                ) * dur,
              ),
            )}{" "}
            / {fmt(dur)}
          </div>
        )}
      </Slider>

      {/* left: cover + meta */}
      <div
        // A rich flex container (cover art + meta), not a native control: its
        // children are <div>s, invalid inside <button>, so role="button" +
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
          gap: 14,
          padding: "0 18px",
          minWidth: 0,
          flex: "0 0 auto",
          width: 300,
          cursor: "pointer",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Art
          seed={track?.coverSeed || 0}
          grad={track?.gradient}
          image={track?.image}
          style={{
            width: 56,
            height: 56,
            flex: "0 0 auto",
            boxShadow: "0 1px 2px rgba(0,0,0,.25), 0 6px 16px -4px rgba(0,0,0,.35)",
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div className="truncate" style={{ fontSize: 16, fontWeight: 400 }}>
            {track?.title || "—"}
          </div>
          <div
            className="truncate"
            style={{ fontSize: 13, color: "rgba(20,20,24,.55)", fontWeight: 300 }}
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

      {/* center: LRC / COMMENTS */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 28,
          position: "relative",
          zIndex: 1,
        }}
      >
        <button style={txtBtn} onClick={onOpenLyrics}>
          LRC
        </button>
        <button style={txtBtn} onClick={onOpenComments}>
          30.88K Comments
        </button>
      </div>

      {/* right: controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "0 22px",
          flex: "0 0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <button style={ctlBtn(liked)} onClick={toggleLike} aria-label="Like">
          <Icon.heart size={19} filled={liked} />
        </button>
        <button style={ctlBtn(shuffle)} onClick={() => setShuffle(!shuffle)} aria-label="Shuffle">
          <Icon.shuffle size={18} />
        </button>
        <button style={ctlBtn(repeat)} onClick={onToggleRepeat} aria-label="Repeat">
          <Icon.loop size={18} />
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
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: `translateX(-50%) translateY(${volOpen ? 0 : 6}px)`,
              marginBottom: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              padding: "16px 13px 14px",
              background: "rgba(247,246,244,.86)",
              border: "0.5px solid rgba(255,255,255,.7)",
              borderRadius: 16,
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              backdropFilter: "blur(20px) saturate(180%)",
              opacity: volOpen ? 1 : 0,
              pointerEvents: volOpen ? "auto" : "none",
              transition: "opacity .2s ease, transform .2s ease",
              boxShadow: "0 16px 38px -12px rgba(0,0,0,.45)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9.5,
                letterSpacing: ".1em",
                color: "rgba(20,20,24,.5)",
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
              style={{
                position: "relative",
                width: 5,
                height: 96,
                cursor: "pointer",
                touchAction: "none",
              }}
              parts={{
                track: {
                  style: {
                    position: "absolute",
                    inset: 0,
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
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: `0 0 0 2px ${accent}, 0 1px 3px rgba(0,0,0,.35)`,
                  },
                },
              }}
            />
          </div>
        </div>
        {/* divider: utilities | transport */}
        <span
          style={{
            width: 1,
            height: 22,
            background: "rgba(20,20,24,.18)",
            margin: "0 12px",
            flex: "0 0 auto",
          }}
        />
        <button style={ctlBtn(false)} onClick={() => onPrev && onPrev()} aria-label="Previous">
          <Icon.prev size={21} />
        </button>
        <button
          style={{
            ...ctlBtn(false),
            background: accent,
            color: "#06060a",
            width: 44,
            height: 44,
            borderRadius: "50%",
            margin: "0 4px",
            boxShadow: `0 6px 18px -4px ${accent}`,
          }}
          onClick={() => setPlaying(!playing)}
          aria-label="Play"
        >
          {playing ? <Icon.pause size={22} /> : <Icon.play size={22} />}
        </button>
        <button style={ctlBtn(false)} onClick={() => onNext && onNext()} aria-label="Next">
          <Icon.next size={21} />
        </button>
      </div>
    </div>
  );
});
