import React, { useState, useEffect, useRef } from "react";
import { Icon, Equalizer, Art, artBg, artPair } from "./primitives";
import { MOCK } from "./mockCatalog";

// ============================================================
// NowPlaying — full-bleed cover  ·  Lyrics  (toggle)
// ============================================================
function LyricLines({ lines, accent, active }: { lines: any[]; accent: string; active: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, textAlign: "center", padding: "8% 12%" }}>
      {lines.map((l, i) => {
        const on = i === active;
        if (!l.line) return <div key={i} style={{ height: 2 }}/>;
        return (
          <div key={i} style={{
            fontSize: on ? 26 : 21, fontWeight: 300, letterSpacing: ".01em",
            lineHeight: 1.35,
            color: on ? accent : "rgba(255,255,255,.62)",
            transition: "color .4s, font-size .4s",
            paddingBottom: on ? 14 : 0,
            borderBottom: on ? `1.5px solid ${accent}88` : "none",
          }}>{l.line}</div>
        );
      })}
    </div>
  );
}

type Props = {
  track: any;
  accent: string;
  liked: boolean;
  toggleLike: () => void;
  lyrics: any[];
  onClose: () => void;
  mono?: boolean;
  initialMode?: string;
  queue?: any[];
  onPlay?: (t: any) => void;
  current?: any;
  onNext?: () => void;
  onPrev?: () => void;
};

export function NowPlaying({ track, accent, liked, toggleLike, lyrics, onClose, mono = true, initialMode = "cover", queue = [], onPlay, current, onNext, onPrev }: Props) {
  const [mode, setMode] = useState(initialMode);   // cover | lyrics | comments
  const [queueOpen, setQueueOpen] = useState(false);   // down axis = queue
  const touch = useRef<{ x: number; y: number } | null>(null);
  const lines = (lyrics && lyrics.length) ? lyrics : [{ line: "No lyrics for this track." }];
  const [active, setActive] = useState(2);
  const [likedC, setLikedC] = useState<Set<string>>(new Set());
  const toggleC = (id: string) => setLikedC(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const comments = (typeof MOCK !== "undefined" && MOCK.comments) || [];
  useEffect(() => {
    const id = setInterval(() => setActive(a => {
      let n = a + 1;
      while (n < lines.length && !lines[n].line) n++;
      return n >= lines.length ? 0 : n;
    }), 3200);
    return () => clearInterval(id);
  }, [lines]);

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
      if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); setQueueOpen(true); }
      else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation();
        if (queueOpen) setQueueOpen(false); else setMode(m => m === "lyrics" ? "cover" : "lyrics"); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [queueOpen]);

  // floating tag stack (top-left)
  const TagStack = ({ extra }: { extra?: any }) => (
    <div style={{ position: "absolute", top: 64, left: 48, zIndex: 6, display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
      <button onClick={toggleLike} aria-label="Like" style={{ background: "none", border: 0, cursor: "pointer",
        color: accent, padding: 0, filter: `drop-shadow(0 4px 12px ${accent}88)` }}>
        <Icon.heart size={30} filled={liked}/>
      </button>
      {extra}
    </div>
  );

  return (
    <div className="fade-in" style={{ height: "100%", position: "relative", background: "#08080b", overflow: "hidden" }}
      onTouchStart={(e: React.TouchEvent) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; }}
      onTouchEnd={(e: React.TouchEvent) => {
        if (!touch.current) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touch.current.x, dy = t.clientY - touch.current.y;
        const ax = Math.abs(dx), ay = Math.abs(dy);
        touch.current = null;
        if (Math.max(ax, ay) < 40) return;
        if (ax > ay) { dx < 0 ? (onNext && onNext()) : (onPrev && onPrev()); }   // left=next, right=prev
        else if (dy < 0) { if (queueOpen) setQueueOpen(false); else setMode(m => m === "lyrics" ? "cover" : "lyrics"); }  // up=lyrics
        else { setQueueOpen(true); }   // down=queue
      }}>
      {/* close */}
      <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 18, right: 56, zIndex: 30,
        background: "none", border: 0, color: "rgba(255,255,255,.7)", cursor: "pointer", padding: 4 }}>
        <Icon.close size={20}/>
      </button>

      {/* full-bleed hero (portrait drop) — stays put; lyrics panel slides over its right half */}
      <Art seed={coverSeed} grad={grad} image={track?.image} mono={mono}
        style={{ position: "absolute", inset: 0, height: "100%" }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 2,
          background: "radial-gradient(60% 60% at 50% 50%, transparent 0%, rgba(6,6,9,.55) 100%)" }}/>
        <TagStack extra={
          mode === "cover" ? (
            <>
              <span className="tag">{track?.quality || "SQ"}</span>
              {track?.version && track.version !== "studio" &&
                <span className="tag" style={{ textTransform: "capitalize" }}>{track.version}</span>}
              {track?.vipOnly && <span className="pill-accent">VIP</span>}
              <span className="tag" style={{ cursor: "pointer" }} onClick={() => setMode("lyrics")}>Lyrics</span>
              <span className="tag" style={{ cursor: "pointer" }} onClick={() => setMode("comments")}>Comments</span>
            </>
          ) : (
            <>
              <span className="pill-accent" style={{ cursor: "pointer" }} onClick={() => setMode("cover")}>Cover</span>
              <span className="tag" style={{ cursor: "pointer" }} onClick={() => setMode(lyricsMode ? "comments" : "lyrics")}>{lyricsMode ? "Comments" : "Lyrics"}</span>
            </>
          )
        }/>
        <div style={{ position: "absolute", left: 48, bottom: 44, zIndex: 6 }}>
          <div style={{ fontSize: 30, fontWeight: 300, letterSpacing: ".02em" }}>{track?.title}</div>
          <div style={{ fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,.6)" }}>{track?.artist}</div>
          {track?.credits && <div className="mlabel" style={{ color: "rgba(255,255,255,.4)", marginTop: 7, fontSize: 10 }}>
            Written by {track.credits.music} · Produced by {track.credits.producer}</div>}
        </div>
      </Art>

      {/* rotating disc — centered in cover mode, glides into the left half for lyrics / comments */}
      <div aria-hidden style={{ position: "absolute", top: "50%", left: panelOpen ? "21%" : "50%",
        width: 300, height: 300, marginLeft: -150, marginTop: -150, zIndex: 4,
        transform: `scale(${panelOpen ? 0.82 : 1})`, transformOrigin: "center",
        transition: `left .62s ${NP_EASE}, transform .62s ${NP_EASE}` }}>
        <div className="grain" data-hero="1" style={{ width: 300, height: 300, borderRadius: "50%", overflow: "hidden", position: "relative",
          background: artBg(coverSeed + 1, grad),
          boxShadow: `0 0 90px -10px ${b}, 0 30px 80px rgba(0,0,0,.5)`,
          animation: "spin 26s linear infinite" }}>
          {track?.image && <img src={track.image} alt="" draggable={false}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}/>}
          {/* vinyl centre — subtle spindle detail */}
          <div aria-hidden style={{ position: "absolute", top: "50%", left: "50%", width: 60, height: 60, marginLeft: -30, marginTop: -30,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(0,0,0,.5), rgba(0,0,0,.18) 60%, transparent 72%)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)" }}/>
          <div aria-hidden style={{ position: "absolute", top: "50%", left: "50%", width: 12, height: 12, marginLeft: -6, marginTop: -6,
            borderRadius: "50%", background: "rgba(255,255,255,.16)" }}/>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>

      {/* side panel — lyrics or comments — slides in from the right over a blurred tint */}
      <div className="scroll" style={{ position: "absolute", top: 0, right: 0, height: "100%", width: "58%", zIndex: 5,
        transform: panelOpen ? "translateX(0)" : "translateX(100%)",
        opacity: panelOpen ? 1 : 0, pointerEvents: panelOpen ? "auto" : "none",
        transition: `transform .62s ${NP_EASE}, opacity .42s ease`,
        background: `linear-gradient(160deg, ${a}cc, ${b}aa)` }}>
        <div className="grain" style={{ position: "absolute", inset: 0, zIndex: 0,
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", background: "rgba(10,12,18,.35)" }}/>
        <div key={mode} className="np-swap" style={{ position: "relative", zIndex: 2 }}>
          {commentsMode ? (
            <div style={{ padding: "58px 48px 40px" }}>
              <div style={{ fontSize: 26, fontWeight: 200, letterSpacing: ".06em", borderBottom: `2px solid ${accent}`,
                paddingBottom: 12, display: "inline-block", marginBottom: 22 }}>Hot Comments</div>
              {comments.map((c: any) => (
                <div key={c.id} style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
                  <Art seed={c.seed} grad={["#1b1033", accent]} style={{ width: 42, height: 42, borderRadius: "50%", flex: "0 0 auto" }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 400, fontSize: 15, color: "rgba(255,255,255,.92)" }}>{c.text}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                      <button onClick={() => toggleC(c.id)} style={{ background: "none", border: 0, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 7, color: likedC.has(c.id) ? accent : "rgba(255,255,255,.5)" }}>
                        <Icon.heart size={14} filled={likedC.has(c.id)}/>
                        <span className="mlabel" style={{ fontSize: 10 }}>{c.likes + (likedC.has(c.id) ? 1 : 0)}</span>
                      </button>
                      <span className="mlabel" style={{ color: "rgba(255,255,255,.3)", fontSize: 10 }}>{c.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <LyricLines lines={lines} accent={accent} active={active}/>
          )}
        </div>
      </div>

      {/* Up Next handle (bottom-center) — invites the down axis */}
      {!queueOpen && (
        <button onClick={() => setQueueOpen(true)} aria-label="Up Next" style={{
          position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 9,
          display: "flex", alignItems: "center", gap: 9, padding: "9px 18px", cursor: "pointer",
          background: "rgba(14,14,18,.5)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 999,
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", color: "rgba(255,255,255,.82)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.1), 0 8px 24px -10px rgba(0,0,0,.7)" }}>
          <span className="mlabel" style={{ fontSize: 10 }}>Up Next · {queue.length}</span>
          <span style={{ display: "grid", placeItems: "center", transform: "rotate(90deg)" }}><Icon.back size={14}/></span>
        </button>
      )}

      {/* queue sheet — slides up from the bottom */}
      <div className="scroll" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "70%", zIndex: 22,
        transform: queueOpen ? "translateY(0)" : "translateY(102%)",
        transition: `transform .58s ${NP_EASE}`,
        background: `linear-gradient(180deg, ${a}26, rgba(8,8,11,.97) 20%)`,
        backdropFilter: "blur(34px)", WebkitBackdropFilter: "blur(34px)",
        borderTop: "1px solid rgba(255,255,255,.13)", boxShadow: "0 -34px 90px rgba(0,0,0,.62)" }}>
        <div onClick={() => setQueueOpen(false)} style={{ display: "grid", placeItems: "center", padding: "13px 0 4px", cursor: "pointer" }}>
          <div style={{ width: 44, height: 4, borderRadius: 3, background: "rgba(255,255,255,.28)" }}></div>
        </div>
        <div style={{ padding: "8px 44px 44px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 13, marginBottom: 16 }}>
            <span style={{ fontSize: 24, fontWeight: 200, letterSpacing: ".05em" }}>Up Next</span>
            <span className="mlabel" style={{ color: "rgba(255,255,255,.4)" }}>{queue.length} tracks</span>
          </div>
          {/* now playing */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0 14px", borderBottom: "1px solid rgba(255,255,255,.1)", marginBottom: 8 }}>
            <span style={{ width: 18, display: "grid", placeItems: "center" }}><Equalizer playing color={accent} size={15}/></span>
            <Art seed={track?.coverSeed} grad={grad} image={track?.image} style={{ width: 44, height: 44, flex: "0 0 auto" }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, color: accent, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track?.title}</div>
              <div style={{ fontSize: 12.5, fontWeight: 300, color: "rgba(255,255,255,.5)" }}>{track?.artist}</div>
            </div>
            <span className="mlabel" style={{ color: "rgba(255,255,255,.4)", fontSize: 10 }}>Now</span>
          </div>
          {queue.map((t: any, i: number) => (
            <div key={t.id + i} onClick={() => onPlay && onPlay(t)}
              onContextMenu={(e: React.MouseEvent) => window.__TRACKMENU?.(e, t)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "9px 0", cursor: "pointer" }}>
              <span className="mlabel" style={{ width: 18, textAlign: "center", color: "rgba(255,255,255,.32)", fontSize: 11, flex: "0 0 auto" }}>{i + 1}</span>
              <Art seed={t.coverSeed} grad={t.gradient} image={t.image} style={{ width: 40, height: 40, flex: "0 0 auto" }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                <div style={{ fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.artist}</div>
              </div>
              <span className="mlabel" style={{ color: "rgba(255,255,255,.32)", fontSize: 10, flex: "0 0 auto" }}>{t.duration}</span>
            </div>
          ))}
          {!queue.length && <div style={{ padding: 30, color: "rgba(255,255,255,.4)", fontWeight: 300 }}>Queue is empty.</div>}
        </div>
      </div>
    </div>
  );
}
