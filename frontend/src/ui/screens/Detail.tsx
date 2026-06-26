// ============================================================
// Detail — Playlist / Album / Chart detail: cover hero, sticky condensed header,
// list · grid · flow views, multi-select action bar. List/grid are windowed.
// ============================================================
import React, { useState, useRef } from "react";
import type { DetailTarget, VibeTrack } from "@/model/adapt";
import { sortTracks, trackFlowItems, type SortMode, type FlowItem } from "@/model/derive";
import { ToggleGroup } from "@/components/controls/ToggleGroup";
import { ViewToggle } from "@/components/ViewToggle";
import { TextReveal } from "@/components/controls/TextReveal";
import { Icon, Art, artBg, artPair, HeroBackdrop } from "@/components/primitives";
import { FadeIn, Rise, XFade } from "@/components/motion";
import { Button } from "@/components/controls/Button";
import { CoverFlow } from "@/components/CoverFlow";
import { TrackRow } from "@/components/cards/TrackRow";
import { TrackCard } from "@/components/cards/TrackCard";
import { CardGrid } from "@/components/layout/CardGrid";
import { VList } from "@/components/layout/VList";
import { SectionHead } from "@/components/layout/SectionHead";
import { ScrollProvider } from "@/components/layout/ScrollContext";
import { useScreenActions } from "@/hooks/screenActions";

type PlaylistDetailScreenProps = {
  playlist: DetailTarget;
  onPlay: (track: VibeTrack) => void;
  current?: VibeTrack;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (id: string) => void;
  accent: string;
  onOpenArtist?: (artist: { id: string; name: string }) => void;
};

export function PlaylistDetailScreen({
  playlist,
  onPlay,
  current,
  playing,
  liked,
  toggleLike,
  accent,
  onOpenArtist,
}: PlaylistDetailScreenProps) {
  const { enqueue } = useScreenActions();
  const p = playlist;
  const total = p.tracks.length;
  const b1 = artPair(p.coverSeed, p.gradient)[1];
  const [view, setView] = useState("list"); // list | grid | flow
  const [sort, setSort] = useState<SortMode>("order");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const lastSel = useRef<string | null>(null);
  const sorted = React.useMemo(() => sortTracks(p.tracks, sort), [p.tracks, sort]);
  const toggleSel = (track: VibeTrack, e: React.MouseEvent) => {
    setSel((prev) => {
      const n = new Set(prev);
      if (e.shiftKey && lastSel.current != null) {
        const ids = sorted.map((s) => s.t.id);
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

  // Real-world names run long; a fixed 64px title wraps a long CJK name to two
  // lines and deforms the hero. Scale the title down so it stays ~one line (CJK
  // glyphs count double for width); the 2-line clamp below is only a safety net.
  const nameWeight = [...(p.name || "")].reduce(
    (a: number, ch: string) => a + (/[⺀-鿿＀-￯]/.test(ch) ? 2 : 1),
    0,
  );
  const heroTitleSize = nameWeight > 48 ? 34 : nameWeight > 36 ? 42 : nameWeight > 24 ? 52 : 64;

  return (
    <FadeIn style={{ height: "100%", position: "relative", background: "#0a0a0d" }}>
      {/* Full-page background from the cover (Spotify-style, full-height). */}
      <HeroBackdrop image={p.image} seed={p.coverSeed} grad={p.gradient} />

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
        <Button
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
        </Button>
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
        <span className="truncate" style={{ fontSize: 20, fontWeight: 300, flex: 1, minWidth: 0 }}>
          {p.name}
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scroll"
        style={{ position: "relative", zIndex: 2, height: "100%" }}
      >
        <ScrollProvider value={scrollRef}>
          {/* HERO banner — cover + meta side by side. minHeight (not height): real
              titles/descriptions run far longer than the example's, so the
              bottom-aligned column grows DOWN instead of overflowing UP. */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 34,
              minHeight: HERO,
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
              images={p.images}
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
              <TextReveal
                lines={2}
                full={<span style={{ fontSize: 20, fontWeight: 300 }}>{p.name}</span>}
                cardStyle={{ maxWidth: 480 }}
                style={{
                  fontSize: heroTitleSize,
                  fontWeight: 200,
                  letterSpacing: ".005em",
                  lineHeight: 1.04,
                  margin: "12px 0 16px",
                  textWrap: "balance",
                }}
              >
                {p.name}
              </TextReveal>
              {p.description && (
                <TextReveal
                  lines={2}
                  cardStyle={{ maxWidth: 440 }}
                  style={{
                    fontSize: 15,
                    fontWeight: 300,
                    color: "rgba(255,255,255,.7)",
                    maxWidth: 560,
                    lineHeight: 1.5,
                  }}
                >
                  {p.description}
                </TextReveal>
              )}
              <div className="mlabel" style={{ color: "rgba(255,255,255,.5)", marginTop: 14 }}>
                {p.owner} · {total} tracks
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 26 }}>
                <Button
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
                </Button>
                <Button className="pill-ghost">
                  <Icon.infinity size={15} /> Shuffle
                </Button>
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
              <SectionHead title="Tracks" size={22} />
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {view === "list" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span
                      className="mlabel"
                      style={{ color: "rgba(255,255,255,.35)", fontSize: 10, marginRight: 4 }}
                    >
                      Sort
                    </span>
                    <ToggleGroup
                      ariaLabel="Sort tracks"
                      className="sortseg"
                      value={sort}
                      onValueChange={(v) => setSort(v as SortMode)}
                      items={[
                        { value: "order", label: "#" },
                        { value: "title", label: "Title" },
                        { value: "duration", label: "Time" },
                      ]}
                    />
                  </div>
                )}
                <ViewToggle value={view} onChange={setView} />
              </div>
            </div>

            <XFade key={view}>
              {view === "list" && (
                <VList
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
                        onOpenArtist={onOpenArtist}
                      />
                    );
                  }}
                />
              )}
              {view === "grid" && (
                <CardGrid
                  count={p.tracks.length}
                  minColumnWidth={168}
                  gap={26}
                  estimateRowHeight={232}
                  itemKey={(i) => p.tracks[i].id}
                  renderItem={(i) => (
                    <TrackCard
                      track={p.tracks[i]}
                      onPlay={onPlay}
                      accent={accent}
                      onOpenArtist={onOpenArtist}
                    />
                  )}
                />
              )}
              {view === "flow" && (
                <div style={{ height: 520, margin: "0 -48px" }}>
                  <CoverFlow
                    items={trackFlowItems(p.tracks)}
                    center={Math.min(flowCenter, total - 1)}
                    setCenter={setFlowCenter}
                    accent={accent}
                    onOpen={(it: FlowItem) => onPlay(it.obj as VibeTrack)}
                    onPlay={(it: FlowItem) => onPlay(it.obj as VibeTrack)}
                  />
                </div>
              )}
            </XFade>
          </div>
        </ScrollProvider>
      </div>

      {/* multi-select action bar (⌘/Shift-click rows to select) */}
      {sel.size > 0 && (
        // Flex-centred strip: the bar travels up via <Rise> (Motion owns its
        // transform), so the old translateX(-50%) centring would clash — centre
        // it with the wrapper instead. Strip is click-through; bar re-enables it.
        <div
          style={{
            position: "absolute",
            bottom: 26,
            left: 0,
            right: 0,
            zIndex: 40,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Rise
            style={{
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
              pointerEvents: "auto",
            }}
          >
            <span className="mlabel" style={{ color: "#fff", fontSize: 11 }}>
              {sel.size} selected
            </span>
            <Button
              className="mlabel"
              onClick={() => {
                p.tracks.filter((t) => sel.has(t.id)).forEach((t) => enqueue(t.id));
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
            </Button>
            <Button
              className="mlabel"
              onClick={() => {
                const first = p.tracks.find((t) => sel.has(t.id));
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
            </Button>
            <Button
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
            </Button>
          </Rise>
        </div>
      )}
    </FadeIn>
  );
}
