// ============================================================
// Detail screens — Playlist/Album detail · Up Next · Settings
// ============================================================

import React, { useState, useRef } from "react";
import { VirtualList } from "../components/VirtualList";
import { Icon, Equalizer, Art, artBg, artPair } from "./primitives";
import { CoverFlow } from "./CoverFlow";

type TrackRowProps = {
  track: any;
  index: number;
  onPlay: (track: any) => void;
  current?: any;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (id: string) => void;
  accent: string;
  dark?: boolean;
  rank?: number;
  delta?: number;
  selected?: boolean;
  onSelect?: (track: any, e: React.MouseEvent) => void;
};

export function TrackRow({
  track,
  index,
  onPlay,
  current,
  playing,
  liked,
  toggleLike,
  accent,
  dark = true,
  rank,
  delta,
  selected,
  onSelect,
}: TrackRowProps) {
  const isCur = current?.id === track.id;
  const [hover, setHover] = useState(false);
  const col = dark ? "#fff" : "#16161a";
  const sub = dark ? "rgba(255,255,255,.5)" : "rgba(10,10,12,.5)";
  const unavailable = track.available === false;
  const isChart = rank != null;
  const badge: React.CSSProperties = {
    fontFamily: "var(--mono)",
    fontSize: 8.5,
    letterSpacing: ".08em",
    textTransform: "uppercase",
    padding: "2px 5px",
    borderRadius: 3,
    flex: "0 0 auto",
    lineHeight: 1.3,
  };
  const Trend = () => {
    if (delta == null)
      return (
        <span
          style={{
            color: accent,
            fontFamily: "var(--mono)",
            fontSize: 8.5,
            letterSpacing: ".06em",
          }}
        >
          NEW
        </span>
      );
    if (delta > 0)
      return (
        <span
          style={{
            color: "#1ed98a",
            fontSize: 11,
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          ▲<span style={{ fontSize: 9 }}>{delta}</span>
        </span>
      );
    if (delta < 0)
      return (
        <span
          style={{
            color: "#ff6b6b",
            fontSize: 11,
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          ▼<span style={{ fontSize: 9 }}>{-delta}</span>
        </span>
      );
    return <span style={{ color: sub, fontSize: 12 }}>–</span>;
  };
  return (
    <div
      // A rich flex row (art + meta + inline actions), not valid <button>
      // content — role="button" + keyboard handling is the right pattern.
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="button"
      tabIndex={unavailable ? -1 : 0}
      aria-label={track.title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      draggable={!unavailable}
      onDragStart={(e: React.DragEvent) => {
        e.dataTransfer.setData("text/sonance-track", track.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onContextMenu={(e: React.MouseEvent) => window.__TRACKMENU && window.__TRACKMENU(e, track)}
      onClick={(e: React.MouseEvent) => {
        if (unavailable) return;
        if (onSelect && (e.metaKey || e.ctrlKey || e.shiftKey)) {
          onSelect(track, e);
          return;
        }
        onPlay(track);
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!unavailable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onPlay(track);
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "11px 14px",
        cursor: unavailable ? "default" : "pointer",
        opacity: unavailable ? 0.42 : 1,
        background: selected
          ? `${accent}22`
          : hover && !unavailable
            ? dark
              ? "rgba(255,255,255,.06)"
              : "rgba(0,0,0,.04)"
            : "transparent",
        boxShadow: selected ? `inset 2px 0 0 ${accent}` : "none",
        transition: "background .15s",
      }}
    >
      <div style={{ width: isChart ? 30 : 22, textAlign: "center", flex: "0 0 auto" }}>
        {isChart ? (
          <span
            className="mlabel"
            style={{ color: isCur ? accent : col, fontSize: 16, fontWeight: 500 }}
          >
            {rank}
          </span>
        ) : isCur && playing ? (
          <Equalizer playing color={accent} size={14} />
        ) : hover && !unavailable ? (
          <span style={{ color: col }}>
            <Icon.play size={15} />
          </span>
        ) : (
          <span className="mlabel" style={{ color: sub, fontSize: 12 }}>
            {index}
          </span>
        )}
      </div>
      <Art
        seed={track.coverSeed}
        grad={track.gradient}
        image={track.image}
        style={{ width: 44, height: 44, flex: "0 0 auto" }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span
            className="truncate"
            style={{ fontSize: 15, fontWeight: 400, color: isCur ? accent : col }}
          >
            {track.title}
          </span>
          {track.version && track.version !== "studio" && (
            <span
              style={{
                ...badge,
                color: "rgba(255,255,255,.7)",
                border: "1px solid rgba(255,255,255,.22)",
              }}
            >
              {track.version}
            </span>
          )}
          {track.vipOnly && (
            <span style={{ ...badge, color: "#06060a", background: accent, fontWeight: 700 }}>
              VIP
            </span>
          )}
          {unavailable && (
            <span style={{ ...badge, color: sub, border: "1px solid rgba(255,255,255,.18)" }}>
              Unavailable
            </span>
          )}
        </div>
        <div className="truncate" style={{ fontSize: 12.5, fontWeight: 300, color: sub }}>
          {track.artist}
        </div>
      </div>
      {isChart && (
        <span style={{ width: 38, textAlign: "center", flex: "0 0 auto" }}>
          <Trend />
        </span>
      )}
      <button
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          toggleLike(track.id);
        }}
        aria-label="Like"
        style={{
          background: "none",
          border: 0,
          cursor: "pointer",
          padding: 4,
          color: liked.has(track.id) ? accent : hover ? col : "transparent",
        }}
      >
        <Icon.heart size={17} filled={liked.has(track.id)} />
      </button>
      <span
        className="mlabel"
        style={{ color: sub, fontSize: 11, width: 42, textAlign: "right", flex: "0 0 auto" }}
      >
        {track.duration}
      </span>
    </div>
  );
}

// Square track card for the grid view (cover + title + hover play + menu)
type TrackCardProps = {
  track: any;
  onPlay: (track: any) => void;
  accent: string;
};

export function TrackCard({ track, onPlay, accent }: TrackCardProps) {
  const [hover, setHover] = useState(false);
  return (
    <div
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="button"
      tabIndex={0}
      aria-label={track.title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onPlay(track)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPlay(track);
        }
      }}
      onContextMenu={(e: React.MouseEvent) => window.__TRACKMENU && window.__TRACKMENU(e, track)}
      style={{ cursor: "pointer" }}
    >
      <div style={{ position: "relative" }}>
        <Art
          className="art"
          seed={track.coverSeed}
          grad={track.gradient}
          image={track.image}
          style={{ width: "100%", aspectRatio: "1", borderRadius: 6 }}
        />
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onPlay(track);
          }}
          aria-label="Play"
          style={{
            position: "absolute",
            right: 12,
            bottom: 12,
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: 0,
            cursor: "pointer",
            background: accent,
            color: "#06060a",
            display: "grid",
            placeItems: "center",
            opacity: hover ? 1 : 0,
            transform: hover ? "translateY(0)" : "translateY(8px)",
            transition: "opacity .2s, transform .2s",
            boxShadow: `0 10px 26px -6px ${accent}`,
          }}
        >
          <Icon.play size={18} />
        </button>
      </div>
      <div className="truncate" style={{ marginTop: 11, fontSize: 14.5, fontWeight: 400 }}>
        {track.title}
      </div>
      <div
        className="truncate"
        style={{ fontSize: 12.5, fontWeight: 300, color: "rgba(255,255,255,.5)" }}
      >
        {track.artist}
      </div>
    </div>
  );
}

type PlaylistDetailScreenProps = {
  playlist: any;
  onPlay: (track: any) => void;
  current?: any;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (id: string) => void;
  accent: string;
};

export function PlaylistDetailScreen({
  playlist,
  onPlay,
  current,
  playing,
  liked,
  toggleLike,
  accent,
}: PlaylistDetailScreenProps) {
  const p = playlist;
  const total = p.tracks.length;
  const [b1] = [artPair(p.coverSeed, p.gradient)[1]];
  const [view, setView] = useState("list"); // list | grid | flow
  const [sort, setSort] = useState("order"); // order | title | duration
  const [sel, setSel] = useState<Set<string>>(new Set());
  const lastSel = useRef<string | null>(null);
  const toggleSel = (track: any, e: React.MouseEvent) => {
    setSel((prev) => {
      const n = new Set(prev);
      if (e.shiftKey && lastSel.current != null) {
        const ids = sorted.map((s: any) => s.t.id);
        const a = ids.indexOf(lastSel.current),
          b = ids.indexOf(track.id);
        if (a > -1 && b > -1) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          for (let k = lo; k <= hi; k++) n.add(ids[k]);
        }
      } else if (n.has(track.id)) {
        n.delete(track.id);
      } else {
        n.add(track.id);
      }
      return n;
    });
    lastSel.current = track.id;
  };
  const [flowCenter, setFlowCenter] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const HERO = 380;
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bar = stickyRef.current;
    if (!bar) return;
    const on = (e.target as HTMLDivElement).scrollTop > HERO - 120;
    bar.style.opacity = on ? "1" : "0";
    bar.style.transform = on ? "translateY(0)" : "translateY(-100%)";
    bar.style.pointerEvents = on ? "auto" : "none";
  };
  const playFirst = () => onPlay(p.tracks[0]);
  const sorted = React.useMemo(() => {
    const ts = p.tracks.map((t: any, i: number) => ({ t, i }));
    if (sort === "title") ts.sort((a: any, b: any) => a.t.title.localeCompare(b.t.title));
    else if (sort === "duration")
      ts.sort((a: any, b: any) => (a.t.durSec || 0) - (b.t.durSec || 0));
    return ts;
  }, [p.tracks, sort]);

  return (
    <div
      className="fade-in"
      style={{ height: "100%", position: "relative", background: "#0a0a0d" }}
    >
      {/* ambient wash from the cover — full-height, masked to fade out smoothly (no seam) */}
      <div
        className="grain"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "100%",
          zIndex: 0,
          background: artBg(p.coverSeed, p.gradient),
          filter: "blur(70px) saturate(1.25)",
          opacity: 0.4,
          transform: "scale(1.2)",
          WebkitMaskImage: "linear-gradient(180deg, #000 0%, rgba(0,0,0,.5) 32%, transparent 60%)",
          maskImage: "linear-gradient(180deg, #000 0%, rgba(0,0,0,.5) 32%, transparent 60%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "100%",
          zIndex: 1,
          background:
            "linear-gradient(180deg, rgba(10,10,13,.2) 0%, rgba(10,10,13,.55) 40%, #0a0a0d 70%)",
        }}
      />

      {/* sticky condensed header on scroll */}
      <div
        ref={stickyRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 48px 14px 100px",
          background: "rgba(12,12,16,.72)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          opacity: 0,
          transform: "translateY(-100%)",
          transition: "opacity .3s ease, transform .3s cubic-bezier(.2,.7,.2,1)",
          pointerEvents: "none",
        }}
      >
        <button
          onClick={playFirst}
          aria-label="Play"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: 0,
            flex: "0 0 auto",
            cursor: "pointer",
            background: accent,
            color: "#06060a",
            display: "grid",
            placeItems: "center",
            boxShadow: `0 6px 18px -4px ${accent}`,
          }}
        >
          <Icon.play size={16} />
        </button>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            flex: "0 0 auto",
            background: artBg(p.coverSeed, p.gradient),
            boxShadow: "0 4px 12px rgba(0,0,0,.4)",
          }}
        />
        <span style={{ fontSize: 20, fontWeight: 300 }}>{p.name}</span>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scroll"
        style={{ position: "relative", zIndex: 2, height: "100%" }}
      >
        {/* HERO banner — full width, cover + meta side by side, like Spotify */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 34,
            height: HERO,
            padding: "0 48px 32px",
            maxWidth: 1320,
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          <Art
            seed={p.coverSeed}
            grad={p.gradient}
            image={p.image}
            data-hero="1"
            style={{
              width: 248,
              height: 248,
              flex: "0 0 auto",
              borderRadius: 8,
              boxShadow: "0 30px 70px -10px rgba(0,0,0,.7)",
            }}
            glow={b1}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <span className="mlabel" style={{ color: "rgba(255,255,255,.7)" }}>
              {p.kind || "Playlist"}
            </span>
            <div
              style={{
                fontSize: 64,
                fontWeight: 200,
                letterSpacing: ".005em",
                lineHeight: 1.02,
                margin: "12px 0 16px",
                textWrap: "balance",
              }}
            >
              {p.name}
            </div>
            {p.description && (
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 300,
                  color: "rgba(255,255,255,.7)",
                  maxWidth: 560,
                  lineHeight: 1.5,
                }}
              >
                {p.description}
              </div>
            )}
            <div className="mlabel" style={{ color: "rgba(255,255,255,.5)", marginTop: 14 }}>
              {p.owner} · {total} tracks
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 26 }}>
              <button
                className="pill-accent"
                style={{
                  fontSize: 12,
                  padding: "12px 26px",
                  display: "inline-flex",
                  gap: 10,
                  alignItems: "center",
                }}
                onClick={playFirst}
              >
                <Icon.play size={15} /> Play
              </button>
              <button className="pill-ghost">
                <Icon.infinity size={15} /> Shuffle
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT — width-capped, centered, with view toggle */}
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: view === "flow" ? "8px 48px 30px" : "8px 48px 40px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div className="sech">
              <h2 style={{ fontSize: 22 }}>Tracks</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {view === "list" && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    className="mlabel"
                    style={{ color: "rgba(255,255,255,.35)", fontSize: 10, marginRight: 4 }}
                  >
                    Sort
                  </span>
                  {[
                    ["order", "#"],
                    ["title", "Title"],
                    ["duration", "Time"],
                  ].map(([k, l]) => (
                    <button
                      key={k}
                      onClick={() => setSort(k)}
                      className="mlabel"
                      style={{
                        fontSize: 10,
                        padding: "5px 9px",
                        borderRadius: 6,
                        border: 0,
                        cursor: "pointer",
                        background: sort === k ? "rgba(255,255,255,.12)" : "transparent",
                        color: sort === k ? "#fff" : "rgba(255,255,255,.45)",
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
              <div className="viewtoggle">
                <button
                  className={view === "list" ? "on" : ""}
                  onClick={() => setView("list")}
                  aria-label="List view"
                >
                  <Icon.list size={17} />
                </button>
                <button
                  className={view === "grid" ? "on" : ""}
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                >
                  <Icon.grid size={17} />
                </button>
                <button
                  className={view === "flow" ? "on" : ""}
                  onClick={() => setView("flow")}
                  aria-label="Cover flow view"
                >
                  <Icon.flow size={17} />
                </button>
              </div>
            </div>
          </div>

          <div key={view} className="xfade">
            {view === "list" && (
              <VirtualList
                scrollRef={scrollRef}
                count={sorted.length}
                estimateSize={66}
                itemKey={(vi) => sorted[vi].t.id}
                renderItem={(vi) => {
                  const { t, i } = sorted[vi];
                  return (
                    <TrackRow
                      track={t}
                      index={i + 1}
                      rank={p.variant === "chart" ? (t._rank ?? i + 1) : undefined}
                      delta={p.variant === "chart" ? t._delta : undefined}
                      onPlay={onPlay}
                      current={current}
                      selected={sel.has(t.id)}
                      onSelect={toggleSel}
                      playing={playing}
                      liked={liked}
                      toggleLike={toggleLike}
                      accent={accent}
                    />
                  );
                }}
              />
            )}
            {view === "grid" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))",
                  gap: 26,
                }}
              >
                {p.tracks.map((t: any) => (
                  <TrackCard key={t.id} track={t} onPlay={onPlay} accent={accent} />
                ))}
              </div>
            )}
            {view === "flow" && (
              <div style={{ height: 520, margin: "0 -48px" }}>
                <CoverFlow
                  items={p.tracks.map((t: any) => ({
                    id: t.id,
                    name: t.title,
                    sub: t.artist,
                    seed: t.coverSeed,
                    grad: t.gradient,
                    image: t.image,
                    obj: t,
                  }))}
                  center={Math.min(flowCenter, total - 1)}
                  setCenter={setFlowCenter}
                  accent={accent}
                  onOpen={(it: any) => onPlay(it.obj)}
                  onPlay={(it: any) => onPlay(it.obj)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* multi-select action bar (⌘/Shift-click rows to select) */}
      {sel.size > 0 && (
        <div
          className="rise"
          style={{
            position: "absolute",
            bottom: 26,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "12px 14px 12px 22px",
            background: "rgba(20,20,24,.92)",
            borderRadius: 999,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,.12)",
            boxShadow: "0 18px 50px -12px rgba(0,0,0,.7)",
          }}
        >
          <span className="mlabel" style={{ color: "#fff", fontSize: 11 }}>
            {sel.size} selected
          </span>
          <button
            className="mlabel"
            onClick={() => {
              p.tracks
                .filter((t: any) => sel.has(t.id))
                .forEach((t: any) => window.__ENQUEUE && window.__ENQUEUE(t.id));
              setSel(new Set());
            }}
            style={{
              fontSize: 10,
              padding: "8px 14px",
              borderRadius: 999,
              border: 0,
              cursor: "pointer",
              background: accent,
              color: "#06060a",
            }}
          >
            Add to queue
          </button>
          <button
            className="mlabel"
            onClick={() => {
              const first = p.tracks.find((t: any) => sel.has(t.id));
              if (first) onPlay(first);
              setSel(new Set());
            }}
            style={{
              fontSize: 10,
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,.2)",
              cursor: "pointer",
              background: "transparent",
              color: "#fff",
            }}
          >
            Play
          </button>
          <button
            onClick={() => setSel(new Set())}
            aria-label="Clear"
            style={{
              background: "none",
              border: 0,
              cursor: "pointer",
              color: "rgba(255,255,255,.6)",
              display: "grid",
              placeItems: "center",
              padding: 4,
            }}
          >
            <Icon.close size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

type QueueScreenProps = {
  current?: any;
  queue: any[];
  onPlay: (track: any) => void;
  accent: string;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (id: string) => void;
};

export function QueueScreen({
  current,
  queue,
  onPlay,
  accent,
  playing,
  liked,
  toggleLike,
}: QueueScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className="fade-in"
      style={{
        height: "100%",
        display: "grid",
        gridTemplateColumns: "0.9fr 1.1fr",
        background: "radial-gradient(120% 90% at 20% 0%, #1a1320, #0a0a0d)",
      }}
    >
      <div
        style={{
          padding: "70px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <span className="mlabel" style={{ color: accent }}>
          Now Playing
        </span>
        <Art
          seed={current?.coverSeed || 0}
          grad={current?.gradient}
          image={current?.image}
          data-hero="1"
          style={{
            width: 220,
            height: 220,
            marginTop: 22,
            boxShadow: "0 30px 70px rgba(0,0,0,.55)",
          }}
          glow={artPair(current?.coverSeed || 0, current?.gradient)[1]}
        />
        <div style={{ fontSize: 30, fontWeight: 300, marginTop: 26 }}>{current?.title}</div>
        <div style={{ fontSize: 15, fontWeight: 300, color: "rgba(255,255,255,.55)" }}>
          {current?.artist}
        </div>
      </div>
      <div className="scroll" ref={scrollRef} style={{ padding: "64px 24px 30px" }}>
        <div className="mlabel" style={{ color: "rgba(255,255,255,.5)", padding: "0 14px 14px" }}>
          Up Next · {queue.length}
        </div>
        {queue.length > 0 ? (
          <VirtualList
            scrollRef={scrollRef}
            count={queue.length}
            estimateSize={66}
            itemKey={(vi) => queue[vi].id + vi}
            renderItem={(vi) => {
              const t = queue[vi];
              return (
                <TrackRow
                  track={t}
                  index={vi + 1}
                  onPlay={onPlay}
                  current={current}
                  playing={playing}
                  liked={liked}
                  toggleLike={toggleLike}
                  accent={accent}
                />
              );
            }}
          />
        ) : (
          <div style={{ padding: 40, color: "rgba(255,255,255,.4)", fontWeight: 300 }}>
            Queue is empty.
          </div>
        )}
      </div>
    </div>
  );
}

// ---- listening history ----
type HistoryScreenProps = {
  history: any[];
  all: any[];
  onPlay: (track: any) => void;
  current?: any;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (id: string) => void;
  accent: string;
};

export function HistoryScreen({
  history,
  all,
  onPlay,
  current,
  playing,
  liked,
  toggleLike,
  accent,
}: HistoryScreenProps) {
  // most-recent first, drop consecutive repeats
  const recent: any[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const t = history[i];
    if (!t) continue;
    if (recent.length && recent[recent.length - 1].id === t.id) continue;
    recent.push(t);
  }
  // seed older plays so the page reads populated before much listening has happened
  const seedStart = (current?.coverSeed || 0) + 3;
  const seeded: any[] = [];
  for (let i = 0; seeded.length < 14 && i < all.length * 2; i++) {
    const t = all[(seedStart + i) % all.length];
    if (recent.some((r) => r.id === t.id) || seeded.some((s) => s.id === t.id)) continue;
    seeded.push(t);
  }
  const todays = recent;
  const week = seeded.slice(0, 7);
  const earlier = seeded.slice(7, 14);
  const total = todays.length + week.length + earlier.length;
  const hero = todays[0] || week[0] || all[0];

  const Group = ({
    label,
    items,
    startIndex,
  }: {
    label: string;
    items: any[];
    startIndex: number;
  }) =>
    items.length ? (
      <div style={{ marginBottom: 36 }}>
        <div className="sech" style={{ marginBottom: 6 }}>
          <h2>{label}</h2>
        </div>
        {items.map((t, i) => (
          <TrackRow
            key={label + t.id + i}
            track={t}
            index={startIndex + i}
            onPlay={onPlay}
            current={current}
            playing={playing}
            liked={liked}
            toggleLike={toggleLike}
            accent={accent}
          />
        ))}
      </div>
    ) : null;

  return (
    <div
      className="fade-in scroll"
      style={{
        height: "100%",
        background: "radial-gradient(120% 90% at 22% 0%, #16131d, #0a0a0d)",
      }}
    >
      <div style={{ padding: "70px 56px 30px", maxWidth: 1180, margin: "0 auto" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 30, marginBottom: 46 }}>
          <Art
            seed={hero?.coverSeed || 0}
            grad={hero?.gradient}
            image={hero?.image}
            data-hero="1"
            style={{
              width: 168,
              height: 168,
              flex: "0 0 auto",
              boxShadow: "0 30px 70px -18px rgba(0,0,0,.6)",
            }}
            glow={artPair(hero?.coverSeed || 0, hero?.gradient)[1]}
          />
          <div style={{ minWidth: 0, paddingBottom: 6 }}>
            <span className="mlabel" style={{ color: accent, letterSpacing: ".2em" }}>
              Consumption
            </span>
            <div
              style={{
                fontSize: 56,
                fontWeight: 200,
                letterSpacing: "-.015em",
                lineHeight: 1,
                margin: "12px 0 16px",
              }}
            >
              History
            </div>
            <div style={{ fontSize: 14, fontWeight: 300, color: "rgba(255,255,255,.55)" }}>
              Everything you've played recently · {total} tracks
            </div>
            {hero && (
              <button
                onClick={() => onPlay(hero)}
                className="pill-accent"
                style={{
                  marginTop: 22,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  border: 0,
                  cursor: "pointer",
                  padding: "11px 22px",
                  borderRadius: 999,
                  background: accent,
                  color: "#06060a",
                  fontWeight: 500,
                }}
              >
                <Icon.play size={16} /> Resume listening
              </button>
            )}
          </div>
        </div>
        {/* grouped lists */}
        <Group label="Today" items={todays} startIndex={1} />
        <Group label="Earlier this week" items={week} startIndex={1} />
        <Group label="Earlier" items={earlier} startIndex={1} />
        {!total && (
          <div style={{ padding: 50, color: "rgba(255,255,255,.4)", fontWeight: 300 }}>
            Nothing played yet.
          </div>
        )}
      </div>
    </div>
  );
}

// ---- settings controls ----
type SetToggleProps = {
  label: string;
  sub?: string;
  on: boolean;
  onClick: () => void;
};

function SetToggle({ label, sub, on, onClick }: SetToggleProps) {
  return (
    <div
      role="switch"
      aria-checked={on}
      aria-label={label}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 0",
        borderBottom: "1px solid rgba(255,255,255,.08)",
        cursor: "pointer",
      }}
    >
      <div>
        <div style={{ fontSize: 16, fontWeight: 300 }}>{label}</div>
        {sub && (
          <div
            className="mlabel"
            style={{ color: "rgba(255,255,255,.4)", marginTop: 5, fontSize: 10 }}
          >
            {sub}
          </div>
        )}
      </div>
      <span
        style={{
          width: 46,
          height: 26,
          borderRadius: 99,
          flex: "0 0 auto",
          position: "relative",
          background: on ? "var(--accent)" : "rgba(255,255,255,.16)",
          transition: "background .2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: on ? 23 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            transition: "left .2s",
            boxShadow: "0 2px 6px rgba(0,0,0,.3)",
          }}
        />
      </span>
    </div>
  );
}

type SetSegProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (o: string) => void;
};

function SetSeg({ label, value, options, onChange }: SetSegProps) {
  return (
    <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
      <div style={{ fontSize: 16, fontWeight: 300, marginBottom: 12 }}>{label}</div>
      <div style={{ display: "inline-flex", gap: 0, border: "1px solid rgba(255,255,255,.18)" }}>
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              padding: "9px 18px",
              border: 0,
              cursor: "pointer",
              background: value === o ? "var(--accent)" : "transparent",
              color: value === o ? "#06060a" : "rgba(255,255,255,.6)",
              transition: "all .15s",
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

type SettingsScreenProps = {
  accent: string;
  setAccent: (col: string) => void;
  accentOptions: string[];
  settings: any;
  setSettings: (fn: (prev: any) => any) => void;
};

export function SettingsScreen({
  accent,
  setAccent,
  accentOptions,
  settings,
  setSettings,
}: SettingsScreenProps) {
  const s = settings;
  const up = (k: string, v: any) => setSettings((prev) => ({ ...prev, [k]: v }));
  return (
    <div
      className="fade-in scroll"
      style={{
        height: "100%",
        background: "radial-gradient(120% 90% at 80% 0%, #14161d, #0a0a0d)",
      }}
    >
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "70px 40px 60px" }}>
        <div style={{ fontSize: 36, fontWeight: 200, letterSpacing: ".02em" }}>Preferences</div>
        <div className="mlabel" style={{ color: "rgba(255,255,255,.4)", marginTop: 8 }}>
          Personalize Sonance
        </div>

        <div style={{ marginTop: 38 }}>
          <div className="mlabel" style={{ color: accent, marginBottom: 4 }}>
            Accent
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              padding: "16px 0",
              borderBottom: "1px solid rgba(255,255,255,.08)",
            }}
          >
            {accentOptions.map((col) => (
              <button
                key={col}
                onClick={() => setAccent(col)}
                aria-label={col}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: col,
                  cursor: "pointer",
                  border: accent === col ? "2px solid #fff" : "2px solid transparent",
                  boxShadow: accent === col ? `0 0 18px -2px ${col}` : "none",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {accent === col && (
                  <span style={{ color: "#06060a" }}>
                    <Icon.check size={16} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 30 }}>
          <div className="mlabel" style={{ color: accent, marginBottom: 4 }}>
            Playback
          </div>
          <SetSeg
            label="Audio quality"
            value={s.quality}
            options={["STD", "HQ", "SQ"]}
            onChange={(v) => up("quality", v)}
          />
          <SetSeg
            label="Now Playing opens"
            value={s.npMode}
            options={["COVER", "LYRICS"]}
            onChange={(v) => up("npMode", v)}
          />
          <SetToggle
            label="Crossfade tracks"
            sub="8 second blend"
            on={s.crossfade}
            onClick={() => up("crossfade", !s.crossfade)}
          />
          <SetToggle
            label="Gapless playback"
            on={s.gapless}
            onClick={() => up("gapless", !s.gapless)}
          />
        </div>

        <div style={{ marginTop: 30 }}>
          <div className="mlabel" style={{ color: accent, marginBottom: 4 }}>
            Interface
          </div>
          <SetToggle
            label="Flowing waves"
            sub="Animated XMB background"
            on={s.waves}
            onClick={() => up("waves", !s.waves)}
          />
          <SetToggle
            label="Show hot comments"
            on={s.comments}
            onClick={() => up("comments", !s.comments)}
          />
          <SetToggle
            label="Reduce motion"
            on={s.reduceMotion}
            onClick={() => up("reduceMotion", !s.reduceMotion)}
          />
        </div>
      </div>
    </div>
  );
}
