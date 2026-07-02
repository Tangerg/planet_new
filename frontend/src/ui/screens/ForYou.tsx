// ============================================================
// ForYou — rich editorial home: hero · quick tiles · card rails.
// ============================================================
import React, { useMemo, useState } from "react";
import type { ArtistRef, ScreenData, VibeCollection, VibeTrack } from "@/model/vibe";
import { Art } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { CardShell } from "@/components/cards/CardShell";
import { MediaCard } from "@/components/cards/MediaCard";
import { Rail } from "@/components/layout/Rail";
import { HeroBanner } from "@/components/layout/HeroBanner";
import { ScreenScaffold } from "@/components/layout/ScreenScaffold";
import { PageColumn } from "@/components/layout/PageColumn";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/controls/Button";
import { useMorphOpen } from "@/hooks/useMorphOpen";
import { useScreenActions } from "@/hooks/screenActions";

type ForYouScreenProps = {
  data: ScreenData;
  /** The day's recommendations ("每日推荐"); when present, headlines the hero. */
  daily: VibeTrack[];
  openPlaylist: (p: VibeCollection) => void;
  openAlbum: (a: VibeCollection) => void;
  openArtist: (artist: ArtistRef) => void;
  onNav: (view: string) => void;
  accent: string;
};

export const ForYouScreen = React.memo(function ForYouScreen({
  data,
  daily,
  openPlaylist,
  openAlbum,
  openArtist,
  onNav,
  accent,
}: ForYouScreenProps) {
  const open = useMorphOpen();
  const { collMenu } = useScreenActions();
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 5
      ? "Late night"
      : h < 12
        ? "Good morning"
        : h < 18
          ? "Good afternoon"
          : "Good evening";
  })();
  const [chip, setChip] = useState("All");
  const playlists = data.playlists;
  const albums = data.albums;
  const artists = data.artists;
  // "每日推荐" as a synthetic playlist of the day's songs (no provider fetch on
  // open — tracks are already loaded, so fetchDetail:false). It headlines the hero.
  const dailyMix = useMemo<VibeCollection | undefined>(
    () =>
      daily.length
        ? {
            id: "daily-mix",
            name: "Daily Mix",
            kind: "Playlist",
            owner: "For You",
            coverSeed: daily[0].coverSeed,
            gradient: daily[0].gradient,
            image: daily[0].image,
            images: daily[0].images,
            description: "Songs picked for you today — refreshed every morning.",
            tracks: daily,
            fetchDetail: false,
          }
        : undefined,
    [daily],
  );
  const featured = dailyMix ?? playlists[1] ?? playlists[0];
  const tiles = [...playlists, ...albums].slice(0, 8);
  const openTile = (t: VibeCollection) =>
    t.artist && t.kind === "Album" ? openAlbum(t) : openPlaylist(t);

  if (!featured) return <FadeIn className="h-full" />;

  return (
    <ScreenScaffold
      background="#08080b"
      backdrop={{ image: featured.image, seed: featured.coverSeed, grad: featured.gradient }}
    >
      <PageColumn className="pb-[50px] pt-[60px]">
        {/* greeting + chips */}
        <div className="mb-[30px] flex items-end justify-between">
          <div>
            <div className="mlabel mb-2" style={{ color: accent }}>
              {greeting}
            </div>
            <div className="text-[36px] font-extralight tracking-[0.01em]">For You</div>
          </div>
          <div className="flex gap-2.5">
            {["All", "Music", "Mixes", "Charts"].map((c) => (
              <Button
                key={c}
                className={"chip" + (chip === c ? " on" : "")}
                onClick={() => setChip(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        <HeroBanner
          playlist={featured}
          accent={accent}
          onOpen={() => openPlaylist(featured)}
          onPlay={() => openPlaylist(featured)}
        />

        {/* quick tiles — grid-cols-4 is repeat(4, minmax(0,1fr)): a long tile name
            must not blow its track past its share and push the grid past the viewport. */}
        <div className="mb-[44px] grid grid-cols-4 gap-2.5">
          {tiles.map((t) => (
            <CardShell
              key={t.id}
              className="tile"
              scale={1.08}
              liftY={-4}
              label={t.name}
              onActivate={(e) =>
                open(e, {
                  seed: t.coverSeed,
                  grad: t.gradient,
                  image: t.image,
                  artSelector: ".tart",
                  run: () => openTile(t),
                })
              }
              onContextMenu={(e) => collMenu(e, t)}
            >
              <Art
                seed={t.coverSeed}
                grad={t.gradient}
                image={t.image}
                images={t.images}
                px={72}
                className="tart"
              />
              <span className="tname">{t.name}</span>
              <Button
                className="tfab"
                aria-label="Open"
                onClick={(e) => {
                  e.stopPropagation();
                  openTile(t);
                }}
              >
                <Icon.play size={15} />
              </Button>
            </CardShell>
          ))}
        </div>

        <Rail
          title="Made for you"
          onAll={() => onNav("library")}
          count={playlists.length}
          itemKey={(i) => playlists[i].id}
          renderItem={(i) => {
            const p = playlists[i];
            return (
              <MediaCard
                item={p}
                sub={p.kind}
                liftScale={1.12}
                liftY={-6}
                onOpen={() => openPlaylist(p)}
                onPlay={() => openPlaylist(p)}
              />
            );
          }}
        />

        <Rail
          title="Recently played"
          onAll={() => onNav("library")}
          count={albums.length}
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

        <Rail
          title="Your artists"
          onAll={() => onNav("library")}
          count={artists.length}
          itemKey={(i) => artists[i].id}
          renderItem={(i) => {
            const ar = artists[i];
            return (
              <MediaCard
                item={ar}
                round
                sub="Artist"
                liftScale={1.12}
                liftY={-6}
                onOpen={() => openArtist(ar)}
                onPlay={() => openArtist(ar)}
              />
            );
          }}
        />
      </PageColumn>
    </ScreenScaffold>
  );
});
