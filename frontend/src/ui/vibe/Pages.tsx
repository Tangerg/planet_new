// ============================================================
// Pages — Artist · Profile · Browse (genres) · Hot Comments
// ============================================================

import React, { useState, useEffect } from "react";
import { Icon, Art, artBg, artPair, HeroBackdrop } from "./primitives";
import { Button } from "../components/Button";
import { ToggleGroup } from "../components/ToggleGroup";
import { MediaCard } from "./ForYou";
import { CollectionRow } from "./Browse";
import { TrackRow, TrackCard } from "./Detail";
import { CoverFlow } from "./CoverFlow";
import { MOCK } from "./mockCatalog";

// ---------- ARTIST ----------
function StatPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="tag"
      style={{
        background: "rgba(255,255,255,.14)",
        backdropFilter: "blur(8px)",
        borderRadius: 999,
      }}
    >
      {children}
    </span>
  );
}

type ArtistScreenProps = {
  artist: any;
  tracks: any[];
  albums: any[];
  similar: any[];
  onPlay: (track: any) => void;
  current: any;
  playing: boolean;
  liked: any;
  toggleLike: (...args: any[]) => void;
  accent: string;
  onOpenAlbum: (album: any) => void;
  onOpenArtist: (artist: any) => void;
  mono: boolean;
};

function ArtistScreen({
  artist,
  tracks,
  albums,
  similar,
  onPlay,
  current,
  playing,
  liked,
  toggleLike,
  accent,
  onOpenAlbum,
  onOpenArtist,
  mono,
}: ArtistScreenProps) {
  const [tab, setTab] = useState("top");
  const [view, setView] = useState("list");
  const [flowCenter, setFlowCenter] = useState(0);
  useEffect(() => {
    setFlowCenter(0);
  }, [tab]);
  const [_a, b] = artPair(artist.coverSeed, artist.gradient);
  const [followed, setFollowed] = useState(true);
  const _half = Math.ceil(tracks.length / 2);

  return (
    <div
      className="fade-in"
      style={{ height: "100%", position: "relative", background: "#0a0a0d" }}
    >
      <HeroBackdrop
        image={artist.banner || artist.image}
        seed={artist.coverSeed}
        grad={artist.gradient}
      />
      <div className="scroll" style={{ position: "relative", zIndex: 2, height: "100%" }}>
        {/* header */}
        <div style={{ position: "relative", height: 440, overflow: "hidden" }}>
          {/* Spotify-style hero: the photo fills the banner edge-to-edge (cover,
              no letterbox / no border), framed toward the top so the face shows,
              then fades into the page at the bottom. */}
          {artist.banner || artist.image ? (
            <img
              src={artist.banner || artist.image}
              alt=""
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 18%",
                filter: mono ? "grayscale(1)" : "none",
              }}
            />
          ) : (
            <div
              className="grain"
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: artBg(artist.coverSeed, artist.gradient),
              }}
            />
          )}
          {/* Spotify-style scrim: darken the left (where the name sits) and the
              bottom (blend into the page), leaving the face/right clear. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              background:
                "linear-gradient(90deg, rgba(8,8,11,.72) 0%, rgba(8,8,11,.2) 42%, transparent 68%), linear-gradient(180deg, transparent 42%, rgba(10,10,13,.45) 74%, #0a0a0d 100%)",
            }}
          />
          {/* Bottom-anchored via flow (flex-end column), not absolute: text stays
            in flow so it can't overflow the banner. */}
          <div
            style={{
              position: "relative",
              zIndex: 4,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "0 48px 30px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 24,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 200,
                    letterSpacing: ".01em",
                    lineHeight: 1.04,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    overflowWrap: "anywhere",
                  }}
                >
                  {artist.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 20,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <Button
                    onClick={() => setFollowed((f) => !f)}
                    className="tag"
                    style={{
                      cursor: "pointer",
                      borderRadius: 999,
                      border: 0,
                      background: followed
                        ? `linear-gradient(90deg, ${accent}, ${b})`
                        : "rgba(255,255,255,.14)",
                      color: followed ? "#06060a" : "#fff",
                    }}
                  >
                    {followed ? "Following" : "Follow"}
                  </Button>
                  <StatPill>
                    {tracks.length} {tracks.length === 1 ? "Track" : "Tracks"}
                  </StatPill>
                  <StatPill>
                    {albums.length} {albums.length === 1 ? "Album" : "Albums"}
                  </StatPill>
                  <StatPill>{artist.listeners} Listeners</StatPill>
                  {(artist.genres || []).map((g: any) => (
                    <StatPill key={g}>{g}</StatPill>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => onPlay(tracks[0])}
                aria-label="Play"
                style={{
                  flex: "0 0 auto",
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  border: 0,
                  cursor: "pointer",
                  background: accent,
                  color: "#06060a",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: `0 10px 30px -6px ${accent}`,
                }}
              >
                {playing && tracks.some((t: any) => t.id === current?.id) ? (
                  <Icon.pause size={26} />
                ) : (
                  <Icon.play size={26} />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* tabs + content */}
        <div
          style={{
            padding: "26px 48px 40px",
            maxWidth: 1320,
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          <div
            className="tabs"
            style={{ marginBottom: 24, display: "flex", alignItems: "flex-start" }}
          >
            <ToggleGroup
              ariaLabel="Artist section"
              className="tabgroup"
              itemClassName="tab"
              value={tab}
              onValueChange={setTab}
              items={[
                { value: "top", label: "Top 50" },
                { value: "albums", label: "All Albums" },
                { value: "similar", label: "Similar Artist" },
              ]}
            />
            {tab !== "similar" && (
              <ToggleGroup
                ariaLabel="View mode"
                className="viewtoggle"
                style={{ marginLeft: "auto", transform: "translateY(-8px)" }}
                value={view}
                onValueChange={setView}
                items={[
                  { value: "grid", label: <Icon.grid size={17} />, "aria-label": "Grid view" },
                  { value: "list", label: <Icon.list size={17} />, "aria-label": "List view" },
                  {
                    value: "flow",
                    label: <Icon.flow size={17} />,
                    "aria-label": "Cover flow view",
                  },
                ]}
              />
            )}
          </div>

          <div key={tab + view} className="xfade">
            {tab === "top" && view === "list" && (
              <div>
                {tracks.map((t: any, i: number) => (
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
                    onOpenArtist={onOpenArtist}
                  />
                ))}
              </div>
            )}
            {tab === "top" && view === "grid" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))",
                  gap: 26,
                }}
              >
                {tracks.map((t: any) => (
                  <TrackCard
                    key={t.id}
                    track={t}
                    onPlay={onPlay}
                    accent={accent}
                    onOpenArtist={onOpenArtist}
                  />
                ))}
              </div>
            )}
            {tab === "top" && view === "flow" && (
              <div style={{ height: 480, margin: "0 -48px" }}>
                <CoverFlow
                  items={tracks.map((t: any) => ({
                    id: t.id,
                    name: t.title,
                    sub: t.artist,
                    seed: t.coverSeed,
                    grad: t.gradient,
                    image: t.image,
                    images: t.images,
                    obj: t,
                  }))}
                  center={Math.min(flowCenter, tracks.length - 1)}
                  setCenter={setFlowCenter}
                  accent={accent}
                  onOpen={(it: any) => onPlay(it.obj)}
                  onPlay={(it: any) => onPlay(it.obj)}
                />
              </div>
            )}
            {tab === "albums" && view === "grid" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(176px, 1fr))",
                  gap: 24,
                  justifyItems: "start",
                }}
              >
                {albums.map((al: any) => (
                  <MediaCard
                    key={al.id}
                    title={al.name}
                    sub={al.year + ""}
                    seed={al.coverSeed}
                    grad={al.gradient}
                    image={al.image}
                    item={al}
                    onClick={() => onOpenAlbum(al)}
                    onPlay={() => onOpenAlbum(al)}
                  />
                ))}
              </div>
            )}
            {tab === "albums" && view === "list" && (
              <div>
                {albums.map((al: any) => (
                  <CollectionRow
                    key={al.id}
                    name={al.name}
                    sub={al.artist || "Album"}
                    meta={al.year + " · " + (al.tracks ? al.tracks.length : 0) + " tracks"}
                    seed={al.coverSeed}
                    grad={al.gradient}
                    image={al.image}
                    images={al.images}
                    item={al}
                    onOpen={() => onOpenAlbum(al)}
                    onPlay={() => onOpenAlbum(al)}
                  />
                ))}
              </div>
            )}
            {tab === "albums" && view === "flow" && (
              <div style={{ height: 480, margin: "0 -48px" }}>
                <CoverFlow
                  items={albums.map((al: any) => ({
                    id: al.id,
                    name: al.name,
                    sub: al.year + "",
                    seed: al.coverSeed,
                    grad: al.gradient,
                    image: al.image,
                    images: al.images,
                    obj: al,
                  }))}
                  center={Math.min(flowCenter, albums.length - 1)}
                  setCenter={setFlowCenter}
                  accent={accent}
                  onOpen={(it: any) => onOpenAlbum(it.obj)}
                  onPlay={(it: any) => onOpenAlbum(it.obj)}
                  tracksFor={(it: any) => it.obj.tracks}
                  onPlayTrack={onPlay}
                />
              </div>
            )}
            {tab === "similar" && (
              <div className="hrail" style={{ flexWrap: "wrap", overflow: "visible" }}>
                {similar.map((ar: any) => (
                  <MediaCard
                    key={ar.id}
                    round
                    title={ar.name}
                    sub="Artist"
                    seed={ar.coverSeed}
                    grad={ar.gradient}
                    image={ar.image}
                    item={ar}
                    onClick={() => onOpenArtist(ar)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- PROFILE ----------
type ProfileScreenProps = {
  accent: string;
  playlists: any[];
  onOpenPlaylist: (playlist: any) => void;
  onPlay: (track: any) => void;
  mono: boolean;
};

function ProfileScreen({
  accent,
  playlists,
  onOpenPlaylist,
  onPlay: _onPlay,
  mono,
}: ProfileScreenProps) {
  const [_a, b] = ["#1b1033", accent];
  const items = playlists.slice(0, 6).map((p: any, i: number) => ({
    ...p,
    plays: ["8.40K", "4", "69", "127", "2.3K", "910"][i] || "12",
  }));
  const [active, setActive] = useState(1);
  return (
    <div className="fade-in" style={{ height: "100%", position: "relative" }}>
      <Art
        seed={3}
        grad={["#16161c", "#2a2a33"]}
        mono={mono}
        style={{ position: "absolute", inset: 0 }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(8,8,11,.4), rgba(8,8,11,.7))",
          }}
        />
      </Art>
      <div
        style={{
          position: "relative",
          zIndex: 4,
          height: "100%",
          display: "grid",
          // minmax(0,…) so the panels shrink on a narrow window instead of the
          // fixed 300+280 px summing past the viewport and clipping.
          gridTemplateColumns: "minmax(0, 300px) minmax(0, 280px) minmax(0, 1fr)",
          gap: 0,
          padding: "70px 56px 40px",
          alignItems: "start",
        }}
      >
        {/* identity panel */}
        <div
          className="grain"
          style={{
            background: `linear-gradient(160deg, ${accent}, ${b})`,
            color: "#fff",
            padding: "34px 30px",
            minHeight: 320,
          }}
        >
          <div className="mlabel" style={{ opacity: 0.8 }}>
            Name
          </div>
          <div style={{ fontSize: 26, fontWeight: 300, margin: "8px 0 28px" }}>Lily Tran</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 40, fontWeight: 200 }}>598</span>
            <span className="mlabel" style={{ opacity: 0.85 }}>
              Followers
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 18 }}>
            <span style={{ fontSize: 40, fontWeight: 200 }}>6</span>
            <span className="mlabel" style={{ opacity: 0.85 }}>
              Following
            </span>
          </div>
          <div style={{ marginTop: 30, fontWeight: 300, fontSize: 15, opacity: 0.9 }}>
            Chasing reverb &amp; slow choruses.
          </div>
        </div>
        {/* photo */}
        <Art seed={9} grad={["#241003", "#ffb02e"]} mono style={{ height: 380, marginLeft: -1 }} />
        {/* playlists */}
        <div className="scroll" style={{ height: "100%", maxHeight: 420, paddingLeft: 44 }}>
          <span className="tag" style={{ marginBottom: 18, display: "inline-block" }}>
            Playlist
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 14 }}>
            {items.map((p: any, i: number) => (
              <Button
                key={p.id}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const run = () => {
                    setActive(i);
                    onOpenPlaylist(p);
                  };
                  if (window.__MORPH) window.__MORPH(r, p.coverSeed, p.gradient, run, p.image);
                  else run();
                }}
                style={{
                  background:
                    i === active ? `linear-gradient(90deg, ${accent}cc, transparent)` : "none",
                  border: 0,
                  textAlign: "left",
                  cursor: "pointer",
                  padding: "12px 14px",
                  color: "#fff",
                }}
              >
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 300,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                </div>
                <div
                  className="mlabel"
                  style={{
                    color: i === active ? "#06060a" : "var(--tx-3)",
                    marginTop: 5,
                    fontSize: 10,
                  }}
                >
                  {p.plays} played
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- BROWSE (classification facets) ----------
type BrowseScreenProps = {
  onOpenGenre: (name: any) => void;
  accent: string;
};

function BrowseScreen({ onOpenGenre, accent: _accent }: BrowseScreenProps) {
  const C = MOCK.classification;
  const sections = [
    ["Languages", "languages"],
    ["Genres", "genres"],
    ["Scenes", "scenes"],
    ["Moods", "moods"],
    ["Themes", "themes"],
  ];
  return (
    <div
      className="fade-in scroll"
      style={{
        height: "100%",
        background: "radial-gradient(120% 80% at 50% -5%, #16161d, var(--surf-0))",
      }}
    >
      <div style={{ padding: "62px 48px 40px" }}>
        <div style={{ fontSize: 36, fontWeight: 200, marginBottom: 6 }}>Browse</div>
        <div className="mlabel" style={{ color: "var(--tx-3)", marginBottom: 30 }}>
          Filter by language, genre, scene, mood &amp; theme
        </div>
        {sections.map(([label, key]) => (
          <section key={key} style={{ marginBottom: 34 }}>
            <div className="sech" style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 20 }}>{label}</h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))",
                gap: 14,
              }}
            >
              {C[key].map((g: any, i: number) => {
                const [name, color] = g;
                return (
                  <Button
                    key={name}
                    className="gtile rise"
                    style={{ background: color, animationDelay: i * 0.02 + "s" }}
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      const run = () => onOpenGenre(name);
                      if (window.__MORPH) window.__MORPH(r, i, [color, "#06060a"], run);
                      else run();
                    }}
                  >
                    <h3>{name}</h3>
                    <div
                      className="gart grain"
                      style={{ background: artBg(i, [color, "#06060a"]) }}
                    />
                  </Button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// ---------- HOT COMMENTS ----------
const COMMENTS = [
  {
    name: "moonriver",
    seed: 1,
    text: "This one rebuilt my whole evening. The bridge at 2:14 is unreal.",
    likes: 1284,
    time: "2 days ago",
  },
  {
    name: "kai_____",
    seed: 3,
    text: "Found this at 3am and now it lives in my head rent free.",
    likes: 902,
    time: "3 days ago",
  },
  {
    name: "veraa",
    seed: 5,
    text: "The reverb on the vocals — chef's kiss. On repeat all week.",
    likes: 564,
    time: "5 days ago",
  },
  {
    name: "tin.ear",
    seed: 7,
    text: "Came for the cover, stayed for the production. Bravo.",
    likes: 410,
    time: "a week ago",
  },
  {
    name: "nightbus",
    seed: 9,
    text: "Played this on a long drive, felt like the credits of a film.",
    likes: 332,
    time: "a week ago",
  },
  {
    name: "echo.lab",
    seed: 11,
    text: "That outro fade is the most peaceful 20 seconds of my day.",
    likes: 221,
    time: "2 weeks ago",
  },
];

type CommentsScreenProps = {
  track: any;
  accent: string;
  liked: boolean;
  toggleLike: (...args: any[]) => void;
  mono: boolean;
};

function CommentsScreen({ track, accent, liked, toggleLike, mono }: CommentsScreenProps) {
  const [likedC, setLikedC] = useState(new Set<number>());
  const tl = (i: number) =>
    setLikedC((p) => {
      const n = new Set(p);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  return (
    <div
      className="fade-in"
      style={{
        height: "100%",
        display: "grid",
        gridTemplateColumns: "minmax(0, 0.78fr) minmax(0, 1.22fr)",
        background: "var(--surf-0)",
      }}
    >
      <Art
        seed={track?.coverSeed || 0}
        grad={track?.gradient}
        image={track?.image}
        images={track?.images}
        mono={mono}
        data-hero="1"
        style={{ height: "100%" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            background: "linear-gradient(180deg, rgba(8,8,11,.25), rgba(8,8,11,.6))",
          }}
        />
        {/* Top tags + bottom title via flow (space-between column), not absolute. */}
        <div
          style={{
            position: "relative",
            zIndex: 4,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "60px 48px 44px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <Button
              onClick={toggleLike}
              style={{
                background: "none",
                border: 0,
                cursor: "pointer",
                color: accent,
                padding: 0,
                filter: `drop-shadow(0 4px 12px ${accent}88)`,
              }}
            >
              <Icon.heart size={30} filled={liked} />
            </Button>
            <span className="pill-accent">{track?.quality || "SQ"}</span>
            <span className="tag">30.88K Comments</span>
          </div>
          <div style={{ maxWidth: "100%" }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 300,
                borderBottom: "1px solid rgba(255,255,255,.3)",
                paddingBottom: 10,
                maxWidth: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "inline-block",
              }}
            >
              {track?.title}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 300,
                color: "var(--tx-3)",
                marginTop: 10,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {track?.artist}
            </div>
          </div>
        </div>
      </Art>
      <div className="scroll" style={{ height: "100%", padding: "60px 48px 40px" }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 200,
            letterSpacing: ".06em",
            borderBottom: `2px solid ${accent}`,
            paddingBottom: 12,
            display: "inline-block",
            marginBottom: 24,
          }}
        >
          Hot Comments
        </div>
        {COMMENTS.map((c, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 16,
              padding: "18px 0",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <Art
              seed={c.seed}
              grad={["#1b1033", accent]}
              style={{ width: 44, height: 44, borderRadius: "50%", flex: "0 0 auto" }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 400, fontSize: 15 }}>{c.text}</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 12,
                }}
              >
                <Button
                  onClick={() => tl(i)}
                  style={{
                    background: "none",
                    border: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    color: likedC.has(i) ? accent : "var(--tx-3)",
                  }}
                >
                  <Icon.heart size={15} filled={likedC.has(i)} />
                  <span className="mlabel" style={{ fontSize: 10 }}>
                    {c.likes + (likedC.has(i) ? 1 : 0)}
                  </span>
                </Button>
                <span className="mlabel" style={{ color: "var(--tx-4)", fontSize: 10 }}>
                  {c.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ArtistScreen, ProfileScreen, BrowseScreen, CommentsScreen };
