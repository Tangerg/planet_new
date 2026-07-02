// ============================================================
// Detail — Playlist / Album / Chart detail: cover hero, sticky condensed header,
// list · grid · flow views, multi-select action bar. List/grid are windowed.
// ============================================================
import type { ArtistRef, DetailTarget, VibeTrack } from "@/model/vibe";
import { type SortMode } from "@/model/derive";
import { ToggleGroup } from "@/components/controls/ToggleGroup";
import { ViewToggle } from "@/components/ViewToggle";
import { TextReveal } from "@/components/controls/TextReveal";
import { Art, HeroBackdrop } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { HeroArt } from "@/components/HeroArt";
import { FadeIn, Rise, XFade } from "@/components/motion";
import { Button } from "@/components/controls/Button";
import { TrackCollectionView } from "@/components/TrackCollectionView";
import { SectionHead } from "@/components/layout/SectionHead";
import { PageColumn } from "@/components/layout/PageColumn";
import { ScrollProvider } from "@/components/layout/ScrollContext";
import { useDetailScreenModel } from "@/hooks/useDetailScreenModel";

type PlaylistDetailScreenProps = {
  playlist: DetailTarget;
  onPlay: (track: VibeTrack) => void;
  onShufflePlay: (tracks: VibeTrack[]) => void;
  current?: VibeTrack;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (id: string) => void;
  accent: string;
  onOpenArtist?: (artist: ArtistRef) => void;
};

export function PlaylistDetailScreen({
  playlist,
  onPlay,
  onShufflePlay,
  current,
  playing,
  liked,
  toggleLike,
  accent,
  onOpenArtist,
}: PlaylistDetailScreenProps) {
  const p = playlist;
  const total = p.tracks.length;
  const {
    heroHeight: HERO,
    view,
    setView,
    sort,
    setSort,
    sorted,
    sel,
    toggleSel,
    clearSel,
    flowCenter,
    setFlowCenter,
    scrollRef,
    stickyRef,
    handleScroll,
    hasTracks,
    playFirst,
    shuffleAll,
    enqueueSelected,
    playSelected,
  } = useDetailScreenModel(p.tracks, onPlay, onShufflePlay);

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
        className="absolute inset-x-0 top-0 z-30 py-[14px]"
        style={{
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
        <div className="mx-auto flex max-w-[1320px] items-center gap-[14px] pl-[100px] pr-12 2xl:pl-12">
          <Button
            onClick={playFirst}
            disabled={!hasTracks}
            aria-label="Play"
            className="grid h-10 w-10 flex-none place-items-center rounded-full"
            style={{ background: accent, color: "#06060a", boxShadow: `0 6px 18px -4px ${accent}` }}
          >
            <Icon.play size={16} />
          </Button>
          <Art
            seed={p.coverSeed}
            grad={p.gradient}
            image={p.image}
            images={p.images}
            px={34}
            className="h-[34px] w-[34px] flex-none"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,.4)" }}
          />
          <span className="truncate min-w-0 flex-1 text-[20px] font-light">{p.name}</span>
        </div>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="scroll relative z-[2] h-full">
        <ScrollProvider value={scrollRef}>
          {/* HERO banner — cover + meta side by side. minHeight (not height): real
              titles/descriptions run far longer than the example's, so the
              bottom-aligned column grows DOWN instead of overflowing UP. */}
          <PageColumn className="flex items-end gap-[34px] pb-8" style={{ minHeight: HERO }}>
            <HeroArt
              seed={p.coverSeed}
              grad={p.gradient}
              image={p.image}
              images={p.images}
              size={248}
              className="flex-none"
            />
            <div className="min-w-0 flex-1">
              <span className="mlabel text-white/70">{p.kind || "Playlist"}</span>
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
              <div className="mlabel mt-[14px] truncate text-white/50">
                {p.owner} · {total} tracks
              </div>
              <div className="mt-[26px] flex gap-[14px]">
                <Button
                  className="pill-accent inline-flex items-center gap-2.5"
                  style={{ fontSize: 12, padding: "12px 26px" }}
                  onClick={playFirst}
                  disabled={!hasTracks}
                >
                  <Icon.play size={15} /> Play
                </Button>
                <Button className="pill-ghost" onClick={shuffleAll} disabled={!hasTracks}>
                  <Icon.infinity size={15} /> Shuffle
                </Button>
              </div>
            </div>
          </PageColumn>

          {/* CONTENT — width-capped, centered, with view toggle */}
          <PageColumn className={"pt-2 " + (view === "flow" ? "pb-[30px]" : "pb-10")}>
            <div className="mb-[14px] flex items-center justify-between">
              <SectionHead title="Tracks" size={22} />
              <div className="flex items-center gap-4">
                {view === "list" && (
                  <div className="flex items-center gap-1">
                    <span className="mlabel mr-1 text-[10px] text-white/35">Sort</span>
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
              <TrackCollectionView
                view={view}
                tracks={p.tracks}
                listRows={sorted}
                onPlay={onPlay}
                current={current}
                playing={playing}
                liked={liked}
                toggleLike={toggleLike}
                accent={accent}
                onOpenArtist={onOpenArtist}
                flowCenter={flowCenter}
                setFlowCenter={setFlowCenter}
                flowHeight={520}
                rankFor={(t, i) => (p.variant === "chart" ? (t._rank ?? i + 1) : undefined)}
                deltaFor={(t) => (p.variant === "chart" ? t._delta : undefined)}
                selected={sel}
                onSelect={toggleSel}
              />
            </XFade>
          </PageColumn>
        </ScrollProvider>
      </div>

      {/* multi-select action bar (⌘/Shift-click rows to select) */}
      {sel.size > 0 && (
        // Flex-centred strip: the bar travels up via <Rise> (Motion owns its
        // transform), so the old translateX(-50%) centring would clash — centre
        // it with the wrapper instead. Strip is click-through; bar re-enables it.
        <div className="pointer-events-none absolute inset-x-0 bottom-[26px] z-40 flex justify-center">
          <Rise
            className="pointer-events-auto flex items-center gap-[18px] rounded-full py-3 pl-[22px] pr-[14px]"
            style={{
              background: "rgba(20,20,24,.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,.12)",
              boxShadow: "0 18px 50px -12px rgba(0,0,0,.7)",
            }}
          >
            <span className="mlabel text-[11px] text-white">{sel.size} selected</span>
            <Button
              className="mlabel rounded-full px-[14px] py-2 text-[10px]"
              onClick={enqueueSelected}
              style={{ background: accent, color: "#06060a" }}
            >
              Add to queue
            </Button>
            <Button
              className="mlabel rounded-full border border-white/20 bg-transparent px-[14px] py-2 text-[10px] text-white"
              onClick={playSelected}
            >
              Play
            </Button>
            <Button
              onClick={clearSel}
              aria-label="Clear"
              className="grid place-items-center p-1 text-white/60"
            >
              <Icon.close size={16} />
            </Button>
          </Rise>
        </div>
      )}
    </FadeIn>
  );
}
