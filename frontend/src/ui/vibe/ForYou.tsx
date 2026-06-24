// ============================================================
// ForYou — rich editorial home: hero · quick tiles · card rails
// (the structured browsing layer, in the Vibe visual language)
// ============================================================
import React, { useState } from "react";
import type { Image } from "@domain/model/image";
import { Icon, Art, artBg, artPair } from "./primitives";
import { MOCK } from "./mockCatalog";

type MediaCardProps = {
  title: string;
  sub?: string;
  seed?: number;
  grad?: string[];
  image?: string;
  images?: Image[];
  round?: boolean;
  onClick?: (...args: any[]) => void;
  onPlay?: (...args: any[]) => void;
  item?: any;
};

export function MediaCard({
  title,
  sub,
  seed,
  grad,
  image,
  images,
  round,
  onClick,
  onPlay,
  item,
}: MediaCardProps) {
  const handle = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onClick) return;
    const art = e.currentTarget.querySelector(".art");
    const rect = (art || e.currentTarget).getBoundingClientRect();
    if (window.__MORPH) window.__MORPH(rect, seed, grad, onClick, image);
    else onClick();
  };
  return (
    <div
      className={"mcard rise" + (round ? " round" : "")}
      onClick={handle}
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- div serves as interactive card container
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handle(e as any);
        }
      }}
      onMouseEnter={() => window.__AMBIENT && window.__AMBIENT(seed, grad)}
      onContextMenu={item ? (e) => window.__COLLMENU && window.__COLLMENU(e, item) : undefined}
    >
      <Art
        seed={seed}
        grad={grad}
        image={image}
        images={images ?? item?.images}
        px={176}
        className="art"
        glow={(round ? null : artPair(seed, grad)[1]) as any}
      >
        {onPlay && (
          <button
            className="playfab"
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            aria-label="Play"
          >
            <Icon.play size={18} />
          </button>
        )}
      </Art>
      <div className="ttl">{title}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

type RailProps = {
  title: string;
  onAll?: (...args: any[]) => void;
  children?: React.ReactNode;
};

export function Rail({ title, onAll, children }: RailProps) {
  return (
    <section style={{ marginBottom: 40 }}>
      <div className="sech">
        <h2>{title}</h2>
        <button className="all" onClick={onAll}>
          Show all
        </button>
      </div>
      <div className="hrail">{children}</div>
    </section>
  );
}

type HeroBannerProps = {
  playlist: any;
  onOpen: (...args: any[]) => void;
  onPlay: (...args: any[]) => void;
  accent: string;
};

export function HeroBanner({ playlist, onOpen, onPlay, accent }: HeroBannerProps) {
  const [_a, _b] = artPair(playlist.coverSeed, playlist.gradient);
  return (
    <div
      className="grain rise"
      style={{
        position: "relative",
        height: 320,
        overflow: "hidden",
        background: artBg(playlist.coverSeed, playlist.gradient),
        boxShadow: "0 24px 60px -20px rgba(0,0,0,.7)",
        marginBottom: 40,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background: `linear-gradient(90deg, rgba(6,6,10,.82) 0%, rgba(6,6,10,.45) 45%, rgba(6,6,10,.15) 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 56px",
          maxWidth: 640,
        }}
      >
        <span
          className="tag"
          style={{ alignSelf: "flex-start", background: accent, color: "#06060a" }}
        >
          Featured
        </span>
        <div
          style={{
            fontSize: 46,
            fontWeight: 200,
            lineHeight: 1.04,
            letterSpacing: ".005em",
            margin: "16px 0 14px",
            // Real playlist names run long; clamp so the fixed-height banner holds.
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            overflowWrap: "anywhere",
          }}
        >
          {playlist.name}
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 300,
            color: "rgba(255,255,255,.72)",
            maxWidth: 460,
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {playlist.description}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 26, alignItems: "center" }}>
          <button
            className="pill-accent"
            onClick={onPlay}
            style={{
              fontSize: 12,
              padding: "13px 30px",
              display: "inline-flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Icon.play size={15} /> Play
          </button>
          <button
            onClick={(e) => {
              const banner = e.currentTarget.closest("[data-hero]");
              const r = (banner || e.currentTarget).getBoundingClientRect();
              if (window.__MORPH)
                window.__MORPH(r, playlist.coverSeed, playlist.gradient, onOpen, playlist.image);
              else onOpen();
            }}
            className="pill-ghost"
          >
            Open
          </button>
          <span className="mlabel" style={{ color: "rgba(255,255,255,.5)", marginLeft: 6 }}>
            {playlist.tracks.length} tracks
          </span>
        </div>
      </div>
    </div>
  );
}

type ForYouScreenProps = {
  data: any;
  onPlay: (...args: any[]) => void;
  openPlaylist: (...args: any[]) => void;
  openAlbum: (...args: any[]) => void;
  openArtist: (...args: any[]) => void;
  onNav: (...args: any[]) => void;
  accent: string;
};

export const ForYouScreen = React.memo(function ForYouScreen({
  data,
  onPlay: _onPlay,
  openPlaylist,
  openAlbum,
  openArtist,
  onNav,
  accent,
}: ForYouScreenProps) {
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
  const playlists = (data.playlists?.length ? data.playlists : MOCK.playlists) as any[];
  const albums = (data.albums?.length ? data.albums : MOCK.albums) as any[];
  const artists = (data.artists?.length ? data.artists : MOCK.artists) as any[];
  const featured = playlists[1] || playlists[0];
  const tiles = [...playlists, ...albums].slice(0, 8);
  const openTile = (t: any) => (t.artist && t.kind === "Album" ? openAlbum(t) : openPlaylist(t));

  if (!featured) return <div className="fade-in" style={{ height: "100%" }} />;

  return (
    <div
      className="fade-in scroll"
      style={{
        height: "100%",
        background: "radial-gradient(120% 80% at 30% -5%, #181922, #0c0c10 55%, #08080b)",
      }}
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
              <button
                key={c}
                className={"chip" + (chip === c ? " on" : "")}
                onClick={() => setChip(c)}
              >
                {c}
              </button>
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
          {tiles.map((t: any, i: number) => (
            <div
              key={t.id}
              className="tile rise"
              style={{ animationDelay: i * 0.03 + "s" }}
              // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- div serves as interactive tile container
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openTile(t);
                }
              }}
              onMouseEnter={() => window.__AMBIENT && window.__AMBIENT(t.coverSeed, t.gradient)}
              onContextMenu={(e) => window.__COLLMENU && window.__COLLMENU(e, t)}
              onClick={(e) => {
                const art = e.currentTarget.querySelector(".tart");
                const rect = (art || e.currentTarget).getBoundingClientRect();
                const run = () => openTile(t);
                if (window.__MORPH) window.__MORPH(rect, t.coverSeed, t.gradient, run, t.image);
                else run();
              }}
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
              <button
                className="tfab"
                aria-label="Open"
                onClick={(e) => {
                  e.stopPropagation();
                  openTile(t);
                }}
              >
                <Icon.play size={15} />
              </button>
            </div>
          ))}
        </div>

        <Rail title="Made for you" onAll={() => onNav("library")}>
          {playlists.map((p: any) => (
            <MediaCard
              key={p.id}
              title={p.name}
              sub={p.kind}
              seed={p.coverSeed}
              grad={p.gradient}
              image={p.image}
              item={p}
              onClick={() => openPlaylist(p)}
              onPlay={() => openPlaylist(p)}
            />
          ))}
        </Rail>

        <Rail title="Recently played" onAll={() => onNav("library")}>
          {albums.map((al: any) => (
            <MediaCard
              key={al.id}
              title={al.name}
              sub={al.artist}
              seed={al.coverSeed}
              grad={al.gradient}
              image={al.image}
              item={al}
              onClick={() => openAlbum(al)}
              onPlay={() => openAlbum(al)}
            />
          ))}
        </Rail>

        <Rail title="Your artists" onAll={() => onNav("library")}>
          {artists.map((ar: any) => (
            <MediaCard
              key={ar.id}
              round
              title={ar.name}
              sub="Artist"
              seed={ar.coverSeed}
              grad={ar.gradient}
              image={ar.image}
              item={ar}
              onClick={() => openArtist(ar)}
              onPlay={() => openArtist(ar)}
            />
          ))}
        </Rail>
      </div>
    </div>
  );
});
