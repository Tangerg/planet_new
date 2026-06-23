// ============================================================
// PlayerBar — frosted glass transport bar (owns its own ticking)
// ============================================================
import React, { useState, useEffect, useRef } from "react";
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
  onNext?: () => void;
  onPrev?: () => void;
};

export function PlayerBar({
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
  onNext,
  onPrev,
}: Props) {
  const dur = track?.durSec || 222;
  const [pos, setPos] = useState(0);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [vol, setVol] = useState(0.8);
  const [volOpen, setVolOpen] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const volTrackRef = useRef<HTMLDivElement | null>(null);
  const volDrag = useRef(false);
  const setVolFromY = (clientY: number) => {
    const el = volTrackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setVol(Math.max(0, Math.min(1, 1 - (clientY - r.top) / r.height)));
  };

  useEffect(() => {
    setPos(Math.round(dur * 0.32));
  }, [track?.id, dur]);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(
      () =>
        setPos((p) => {
          if (p >= dur) {
            if (!repeat) setTimeout(() => onNext && onNext(), 0);
            return 0;
          }
          return p + 1;
        }),
      1000,
    );
    return () => clearInterval(id);
  }, [playing, dur, repeat, onNext]);

  const [a, b] = artPair(track?.coverSeed || 0, track?.gradient);
  const pct = Math.min(100, (pos / dur) * 100);

  const seek = (e: React.MouseEvent) => {
    const r = barRef.current!.getBoundingClientRect();
    setPos(Math.round(((e.clientX - r.left) / r.width) * dur));
  };

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
      {/* progress line + scrubber */}
      <div
        ref={barRef}
        onClick={seek}
        onMouseMove={(e) => {
          const r = barRef.current!.getBoundingClientRect();
          setHoverX(e.clientX - r.left);
        }}
        onMouseLeave={() => setHoverX(null)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 14,
          cursor: "pointer",
          zIndex: 4,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "rgba(20,20,24,.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: pct + "%",
            height: 3,
            background: `linear-gradient(90deg, ${accent}, ${b})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -2.5,
            left: pct + "%",
            transform: "translateX(-50%)",
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: `0 0 0 2px ${accent}, 0 2px 6px rgba(0,0,0,.45)`,
            opacity: hoverX != null ? 1 : 0,
            transition: "opacity .16s",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
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
      </div>

      {/* left: cover + meta */}
      <div
        onClick={(e) => {
          const art = e.currentTarget.querySelector(".grain");
          const r = (art || e.currentTarget).getBoundingClientRect();
          window.__MORPH
            ? window.__MORPH(
                r,
                track?.coverSeed || 0,
                track?.gradient,
                onOpenNowPlaying,
                track?.image,
              )
            : onOpenNowPlaying();
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
          <div
            style={{
              fontSize: 16,
              fontWeight: 400,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {track?.title || "—"}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(20,20,24,.55)",
              fontWeight: 300,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {track?.artist || ""}
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
        <button style={ctlBtn(repeat)} onClick={() => setRepeat((r) => !r)} aria-label="Repeat">
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
            style={{ ...ctlBtn(false), opacity: vol === 0 ? 0.4 : 1 }}
            aria-label="Volume"
            onClick={() => setVol((v) => (v > 0 ? 0 : 0.8))}
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
              {Math.round(vol * 100)}
            </span>
            <div
              ref={volTrackRef}
              onPointerDown={(e) => {
                volDrag.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                setVolFromY(e.clientY);
              }}
              onPointerMove={(e) => {
                if (volDrag.current) setVolFromY(e.clientY);
              }}
              onPointerUp={() => {
                volDrag.current = false;
              }}
              style={{
                position: "relative",
                width: 5,
                height: 96,
                borderRadius: 999,
                background: "rgba(20,20,24,.16)",
                cursor: "pointer",
                touchAction: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: vol * 100 + "%",
                  background: accent,
                  borderRadius: 999,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: (1 - vol) * 100 + "%",
                  transform: "translate(-50%,-50%)",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: `0 0 0 2px ${accent}, 0 1px 3px rgba(0,0,0,.35)`,
                }}
              />
            </div>
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
}
