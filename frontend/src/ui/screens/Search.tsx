// ============================================================
// Search — taxonomy results: top artist · songs · playlist/artist/album rails.
// ============================================================
import React from "react";
import { useTranslation } from "react-i18next";
import type { ArtistRef, SearchResults, VibeCollection, VibeTrack } from "@/model/vibe";
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
import { useSearchScreenModel } from "@/hooks/useSearchScreenModel";
import { useCollectionPlayback } from "@/hooks/useCollectionPlayback";
import { useAccent } from "@/hooks/accent";

type SearchScreenProps = {
  onPlay: (track: VibeTrack) => void;
  current?: VibeTrack;
  playing: boolean;
  // Controlled by Shell so the typed query survives a back-navigation round-trip.
  query: string;
  onQuery: (q: string) => void;
  openArtist: (artist: ArtistRef) => void;
  openPlaylist: (p: VibeCollection) => void;
  openAlbum: (a: VibeCollection) => void;
  liked: Set<string>;
  toggleLike: (track: VibeTrack) => void;
  /** Real search: provider.search results projected to vibe shapes. */
  search?: (q: string) => Promise<SearchResults>;
};

export function SearchScreen({
  onPlay,
  current,
  playing,
  query: q,
  onQuery: setQ,
  openArtist,
  openPlaylist,
  openAlbum,
  liked,
  toggleLike,
  search,
}: SearchScreenProps) {
  const accent = useAccent();
  const { t } = useTranslation();
  const open = useMorphOpen();
  const model = useSearchScreenModel({ query: q, search });
  const { albums, artists, chips, normalizedTerm, playlists, status, topArtist, topTracks } = model;
  // Stable so the memoized rail cards don't re-render on every keystroke.
  const { playCollection, canPlayCollection } = useCollectionPlayback(onPlay);
  const emptyMsg = (text: string) => (
    <Empty className="p-[90px] text-center text-[22px]">{text}</Empty>
  );
  const statusText =
    status === "idle"
      ? t("search.idle")
      : status === "loading"
        ? t("search.loading", { query: q })
        : status === "empty"
          ? t("search.empty", { query: q })
          : "";

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
            placeholder={t("search.placeholder")}
            aria-label={t("common.search")}
            className="flex-1 border-0 bg-transparent font-sans text-[28px] font-light tracking-[0.01em] text-white outline-none"
          />
          {q && (
            <Button onClick={() => setQ("")} className="text-tx-3" aria-label={t("common.clear")}>
              <Icon.close size={20} />
            </Button>
          )}
        </div>
        <div className="mt-[22px] flex flex-wrap gap-2.5">
          {chips.map((c) => (
            <Button
              key={c}
              className={"chip" + (normalizedTerm === c.toLowerCase() ? " on" : "")}
              onClick={() => setQ(c)}
            >
              {c}
            </Button>
          ))}
        </div>

        {status !== "ready" ? (
          emptyMsg(statusText || model.emptyMessage)
        ) : (
          <div
            className="mt-10 grid gap-12"
            style={{ gridTemplateColumns: "minmax(280px, 0.9fr) minmax(0, 1.1fr)" }}
          >
            {/* top result */}
            <div>
              <SectionHead title={t("search.topResult")} size={22} />
              {topArtist && (
                <LiftButton
                  scale={1.04}
                  liftY={-6}
                  onClick={(e) =>
                    open(e, {
                      seed: topArtist.coverSeed,
                      grad: topArtist.gradient,
                      image: topArtist.image,
                      artSelector: ".grain",
                      run: () => openArtist(topArtist),
                    })
                  }
                  className="grain relative block w-full overflow-hidden border-0 bg-surf-2 p-6 text-left"
                >
                  <Art
                    seed={topArtist.coverSeed}
                    grad={topArtist.gradient}
                    image={topArtist.image}
                    images={topArtist.images}
                    className="rounded-full"
                    style={{ width: 96, height: 96, boxShadow: "0 12px 30px rgba(0,0,0,.5)" }}
                  />
                  <div className="mt-5 line-clamp-2 text-[30px] font-light [overflow-wrap:anywhere]">
                    {topArtist.name}
                  </div>
                  <span className="tag mt-[14px]" style={{ display: "inline-block" }}>
                    {t("common.artist")}
                  </span>
                </LiftButton>
              )}
            </div>
            {/* songs */}
            <div>
              <SectionHead title={t("common.songs")} size={22} />
              {topTracks.map((t, i) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  index={i + 1}
                  onPlay={onPlay}
                  current={current}
                  playing={playing}
                  liked={liked}
                  toggleLike={toggleLike}
                  onOpenArtist={openArtist}
                />
              ))}
            </div>
          </div>
        )}

        {playlists.length > 0 && (
          <section className="mt-[44px]">
            <SectionHead title={t("common.playlists")} />
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
                    onOpen={openPlaylist}
                    onPlay={playCollection}
                    playable={canPlayCollection(p)}
                  />
                );
              }}
            />
          </section>
        )}

        {artists.length > 0 && (
          <section className="mt-[44px]">
            <SectionHead title={t("common.artists")} />
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
                    sub={t("common.artist")}
                    liftScale={1.12}
                    liftY={-6}
                    onOpen={openArtist}
                  />
                );
              }}
            />
          </section>
        )}
        {albums.length > 0 && (
          <section className="mt-6">
            <SectionHead title={t("common.albums")} />
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
                    onOpen={openAlbum}
                    onPlay={playCollection}
                    playable={canPlayCollection(al)}
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
