// ============================================================
// Search — taxonomy results: top artist · songs · artist/album rails.
// ============================================================
import React, { useState, useEffect } from "react";
import type { VibeTrack, VibeArtist, VibeCollection } from "@/model/adapt";
import { SEARCH_SUGGESTIONS } from "@/model/defaults";
import { Icon, Art } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { LiftButton } from "@/components/lift";
import { MediaCard } from "@/components/cards/MediaCard";
import { TrackRow } from "@/components/cards/TrackRow";
import { SectionHead } from "@/components/layout/SectionHead";
import { CardRail } from "@/components/layout/CardRail";
import { FadeIn } from "@/components/motion";
import { useMorphOpen } from "@/hooks/useMorphOpen";

type SearchResults = { tracks: VibeTrack[]; artists: VibeArtist[]; albums: VibeCollection[] };

type SearchScreenProps = {
  onPlay: (track: VibeTrack) => void;
  current?: VibeTrack;
  playing: boolean;
  accent: string;
  // Controlled by Shell so the typed query survives a back-navigation round-trip.
  query: string;
  onQuery: (q: string) => void;
  openArtist: (artist: { id: string; name: string }) => void;
  openAlbum: (a: VibeCollection) => void;
  liked: Set<string>;
  toggleLike: (id: string) => void;
  /** Real search: provider.search results projected to vibe shapes. */
  search?: (q: string) => Promise<SearchResults>;
};

export function SearchScreen({
  onPlay,
  current,
  playing,
  accent,
  query: q,
  onQuery: setQ,
  openArtist,
  openAlbum,
  liked,
  toggleLike,
  search,
}: SearchScreenProps) {
  const open = useMorphOpen();
  const [results, setResults] = useState<SearchResults>({ tracks: [], artists: [], albums: [] });
  const [loading, setLoading] = useState(false);
  // Debounce input 320ms, then call provider.search; an empty query clears results.
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults({ tracks: [], artists: [], albums: [] });
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    const id = setTimeout(() => {
      const fn = search ?? (async () => ({ tracks: [], artists: [], albums: [] }));
      fn(term)
        .then((r) => {
          if (alive) {
            setResults(r);
            setLoading(false);
          }
        })
        .catch(() => {
          if (alive) setLoading(false);
        });
    }, 320);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [q, search]);
  const ql = q.trim().toLowerCase();

  const { tracks, artists, albums } = results;
  const chips = SEARCH_SUGGESTIONS;
  const top = artists[0] || null;
  const emptyMsg = (text: string) => (
    <div
      style={{
        textAlign: "center",
        padding: 90,
        color: "var(--tx-3)",
        fontWeight: 300,
        fontSize: 22,
      }}
    >
      {text}
    </div>
  );

  return (
    <FadeIn
      className="scroll"
      style={{
        height: "100%",
        background: "radial-gradient(120% 80% at 30% -5%, #16161d, var(--surf-0))",
      }}
    >
      <div style={{ padding: "60px 48px 44px" }}>
        {/* input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            borderBottom: `1.5px solid ${accent}`,
            paddingBottom: 14,
            maxWidth: 640,
          }}
        >
          <span style={{ color: accent }}>
            <Icon.search size={26} />
          </span>
          <input
            // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: search input should focus on mount
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tracks, artists, albums…"
            style={{
              flex: 1,
              border: 0,
              outline: 0,
              background: "none",
              fontFamily: "var(--sans)",
              fontWeight: 300,
              fontSize: 28,
              letterSpacing: ".01em",
              color: "#fff",
            }}
          />
          {q && (
            <Button
              onClick={() => setQ("")}
              style={{ background: "none", border: 0, color: "var(--tx-3)", cursor: "pointer" }}
            >
              <Icon.close size={20} />
            </Button>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
          {chips.map((c) => (
            <Button
              key={c}
              className={"chip" + (ql === c.toLowerCase() ? " on" : "")}
              onClick={() => setQ(c)}
            >
              {c}
            </Button>
          ))}
        </div>

        {!q.trim() ? (
          emptyMsg("Search tracks, artists & albums…")
        ) : loading ? (
          emptyMsg(`Searching “${q}”…`)
        ) : !tracks.length && !artists.length && !albums.length ? (
          emptyMsg(`Nothing for “${q}”…`)
        ) : (
          <div
            style={{
              marginTop: 40,
              display: "grid",
              gridTemplateColumns: "minmax(280px, 0.9fr) minmax(0, 1.1fr)",
              gap: 48,
            }}
          >
            {/* top result */}
            <div>
              <SectionHead title="Top result" size={22} />
              {top && (
                <LiftButton
                  scale={1.04}
                  liftY={-6}
                  onClick={(e) =>
                    open(e, {
                      seed: top.coverSeed,
                      grad: top.gradient,
                      image: top.image,
                      artSelector: ".grain",
                      run: () => openArtist(top),
                    })
                  }
                  className="grain"
                  style={{
                    position: "relative",
                    width: "100%",
                    textAlign: "left",
                    border: 0,
                    cursor: "pointer",
                    background: "var(--surf-2)",
                    padding: 24,
                    overflow: "hidden",
                    display: "block",
                  }}
                >
                  <Art
                    seed={top.coverSeed}
                    grad={top.gradient}
                    image={top.image}
                    images={top.images}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      boxShadow: "0 12px 30px rgba(0,0,0,.5)",
                    }}
                    mono
                  />
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 300,
                      marginTop: 20,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {top.name}
                  </div>
                  <span className="tag" style={{ marginTop: 14, display: "inline-block" }}>
                    Artist
                  </span>
                </LiftButton>
              )}
            </div>
            {/* songs */}
            <div>
              <SectionHead title="Songs" size={22} />
              {tracks.slice(0, 6).map((t, i) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  index={i + 1}
                  onPlay={onPlay}
                  current={current}
                  playing={playing}
                  liked={liked}
                  toggleLike={toggleLike}
                  accent={accent}
                  onOpenArtist={openArtist}
                />
              ))}
            </div>
          </div>
        )}

        {artists.length > 0 && (
          <section style={{ marginTop: 44 }}>
            <SectionHead title="Artists" />
            <CardRail
              count={artists.length}
              itemWidth={176}
              itemKey={(i) => artists[i].id}
              renderItem={(i) => {
                const a = artists[i];
                return (
                  <MediaCard
                    item={a}
                    round
                    sub="Artist"
                    liftScale={1.12}
                    liftY={-6}
                    onOpen={() => openArtist(a)}
                  />
                );
              }}
            />
          </section>
        )}
        {albums.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <SectionHead title="Albums" />
            <CardRail
              count={albums.length}
              itemWidth={176}
              itemKey={(i) => albums[i].id}
              renderItem={(i) => {
                const al = albums[i];
                return (
                  <MediaCard
                    item={al}
                    sub={al.artist}
                    liftScale={1.12}
                    liftY={-6}
                    onOpen={() => openAlbum(al)}
                    onPlay={() => openAlbum(al)}
                  />
                );
              }}
            />
          </section>
        )}
      </div>
    </FadeIn>
  );
}
