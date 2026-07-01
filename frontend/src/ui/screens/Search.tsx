// ============================================================
// Search — taxonomy results: top artist · songs · playlist/artist/album rails.
// ============================================================
import React, { useState, useEffect } from "react";
import type { ArtistRef, SearchResults, VibeCollection, VibeTrack } from "@/model/adapt";
import { SEARCH_SUGGESTIONS } from "@/model/defaults";
import { Art } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { Button } from "@/components/controls/Button";
import { LiftButton } from "@/components/lift";
import { MediaCard } from "@/components/cards/MediaCard";
import { TrackRow } from "@/components/cards/TrackRow";
import { SectionHead } from "@/components/layout/SectionHead";
import { CardRail } from "@/components/layout/CardRail";
import { Empty } from "@/components/layout/Empty";
import { PageColumn } from "@/components/layout/PageColumn";
import { FadeIn } from "@/components/motion";
import { useMorphOpen } from "@/hooks/useMorphOpen";

const EMPTY_RESULTS: SearchResults = { tracks: [], playlists: [], artists: [], albums: [] };

type SearchScreenProps = {
  onPlay: (track: VibeTrack) => void;
  current?: VibeTrack;
  playing: boolean;
  accent: string;
  // Controlled by Shell so the typed query survives a back-navigation round-trip.
  query: string;
  onQuery: (q: string) => void;
  openArtist: (artist: ArtistRef) => void;
  openPlaylist: (p: VibeCollection) => void;
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
  openPlaylist,
  openAlbum,
  liked,
  toggleLike,
  search,
}: SearchScreenProps) {
  const open = useMorphOpen();
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  // Debounce input 320ms, then call provider.search; an empty query clears results.
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    const id = setTimeout(() => {
      const fn = search ?? (async () => EMPTY_RESULTS);
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

  const { tracks, playlists, artists, albums } = results;
  const chips = SEARCH_SUGGESTIONS;
  const top = artists[0] || null;
  const emptyMsg = (text: string) => (
    <Empty className="p-[90px] text-center text-[22px]">{text}</Empty>
  );

  return (
    <FadeIn
      className="scroll h-full"
      style={{ background: "radial-gradient(120% 80% at 30% -5%, #16161d, var(--surf-0))" }}
    >
      <PageColumn className="pb-[44px] pt-[60px]">
        {/* input */}
        <div
          className="flex max-w-[640px] items-center gap-4 pb-[14px]"
          style={{ borderBottom: `1.5px solid ${accent}` }}
        >
          <span style={{ color: accent }}>
            <Icon.search size={26} />
          </span>
          <input
            // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: search input should focus on mount
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tracks, playlists, artists, albums…"
            className="flex-1 border-0 bg-transparent font-sans text-[28px] font-light tracking-[0.01em] text-white outline-none"
          />
          {q && (
            <Button onClick={() => setQ("")} className="text-tx-3">
              <Icon.close size={20} />
            </Button>
          )}
        </div>
        <div className="mt-[22px] flex flex-wrap gap-2.5">
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
          emptyMsg("Search tracks, playlists, artists & albums…")
        ) : loading ? (
          emptyMsg(`Searching “${q}”…`)
        ) : !tracks.length && !playlists.length && !artists.length && !albums.length ? (
          emptyMsg(`Nothing for “${q}”…`)
        ) : (
          <div
            className="mt-10 grid gap-12"
            style={{ gridTemplateColumns: "minmax(280px, 0.9fr) minmax(0, 1.1fr)" }}
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
                  className="grain relative block w-full overflow-hidden border-0 bg-surf-2 p-6 text-left"
                >
                  <Art
                    seed={top.coverSeed}
                    grad={top.gradient}
                    image={top.image}
                    images={top.images}
                    className="rounded-full"
                    style={{ width: 96, height: 96, boxShadow: "0 12px 30px rgba(0,0,0,.5)" }}
                    mono
                  />
                  <div className="mt-5 line-clamp-2 text-[30px] font-light [overflow-wrap:anywhere]">
                    {top.name}
                  </div>
                  <span className="tag mt-[14px]" style={{ display: "inline-block" }}>
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

        {playlists.length > 0 && (
          <section className="mt-[44px]">
            <SectionHead title="Playlists" />
            <CardRail
              count={playlists.length}
              itemWidth={176}
              itemKey={(i) => playlists[i].id}
              renderItem={(i) => {
                const p = playlists[i];
                return (
                  <MediaCard
                    item={p}
                    sub={p.owner}
                    liftScale={1.12}
                    liftY={-6}
                    onOpen={() => openPlaylist(p)}
                    onPlay={() => openPlaylist(p)}
                  />
                );
              }}
            />
          </section>
        )}

        {artists.length > 0 && (
          <section className="mt-[44px]">
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
          <section className="mt-6">
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
      </PageColumn>
    </FadeIn>
  );
}
