// ============================================================
// ForYou — rich editorial home: hero · quick tiles · card rails.
// ============================================================
import React, { useState } from "react";
import type { ScreenData, VibeCollection } from "@/model/adapt";
import { Icon, Art } from "@/components/primitives";
import { CardShell } from "@/components/cards/CardShell";
import { MediaCard } from "@/components/cards/MediaCard";
import { Rail } from "@/components/layout/Rail";
import { HeroBanner } from "@/components/layout/HeroBanner";
import { ScreenScaffold } from "@/components/layout/ScreenScaffold";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/controls/Button";
import { useMorphOpen } from "@/hooks/useMorphOpen";
import { useScreenActions } from "@/hooks/screenActions";
import { MOCK } from "@/model/mock";

type ForYouScreenProps = {
  data: ScreenData;
  openPlaylist: (p: VibeCollection) => void;
  openAlbum: (a: VibeCollection) => void;
  openArtist: (artist: { id: string; name: string }) => void;
  onNav: (view: string) => void;
  accent: string;
};

export const ForYouScreen = React.memo(function ForYouScreen({
  data,
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
  const playlists = data.playlists.length ? data.playlists : MOCK.playlists;
  const albums = data.albums.length ? data.albums : MOCK.albums;
  const artists = data.artists.length ? data.artists : MOCK.artists;
  const featured = playlists[1] || playlists[0];
  const tiles = [...playlists, ...albums].slice(0, 8);
  const openTile = (t: VibeCollection) =>
    t.artist && t.kind === "Album" ? openAlbum(t) : openPlaylist(t);

  if (!featured) return <FadeIn style={{ height: "100%" }} />;

  return (
    <ScreenScaffold
      background="#08080b"
      backdrop={{ image: featured.image, seed: featured.coverSeed, grad: featured.gradient }}
    >
      <div style={{ padding: "60px 56px 50px" }}>
        {/* greeting + chips */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 30,
          }}
        >
          <div>
            <div className="mlabel" style={{ color: accent, marginBottom: 8 }}>
              {greeting}
            </div>
            <div style={{ fontSize: 36, fontWeight: 200, letterSpacing: ".01em" }}>For You</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
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

        {/* quick tiles */}
        <div
          style={{
            display: "grid",
            // minmax(0,1fr) (not bare 1fr): a long tile name must not blow the
            // track past its share and push the grid wider than the viewport.
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
            marginBottom: 44,
          }}
        >
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
      </div>
    </ScreenScaffold>
  );
});
