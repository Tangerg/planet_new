// ============================================================
// Browse — Search (taxonomy results) · Charts · Library hub
// All dark + cohesive with the editorial system.
// ============================================================
import React, { useState, useEffect } from "react";
import { Icon, Art, artBg } from "./primitives";
import { MediaCard } from "./ForYou";
import { TrackRow } from "./Detail";
import { CoverFlow } from "./CoverFlow";
import { MOCK } from "./mockCatalog";

// ---------- SEARCH ----------
type SearchResults = { tracks: any[]; artists: any[]; albums: any[] };

type SearchScreenProps = {
  data: any;
  onPlay: (...args: any[]) => void;
  current: any;
  playing: any;
  accent: any;
  initialQuery?: string;
  openArtist: (...args: any[]) => void;
  openAlbum: (...args: any[]) => void;
  openPlaylist: (...args: any[]) => void;
  liked: any;
  toggleLike: (...args: any[]) => void;
  /** Real search: provider.search results projected to vibe shapes. */
  search?: (q: string) => Promise<SearchResults>;
};

export function SearchScreen({
  data: _data,
  onPlay,
  current,
  playing,
  accent,
  initialQuery = "",
  openArtist,
  openAlbum,
  openPlaylist: _openPlaylist,
  liked,
  toggleLike,
  search,
}: SearchScreenProps) {
  const [q, setQ] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults>({ tracks: [], artists: [], albums: [] });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setQ(initialQuery);
  }, [initialQuery]);
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

  const tracks = results.tracks;
  const artists = results.artists;
  const albums = results.albums;
  const chips = ["周杰伦", "陈奕迅", "薛之谦", "林俊杰", "邓紫棋", "毛不易"];
  const top = artists[0] || null;

  return (
    <div
      className="fade-in scroll"
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
            <button
              onClick={() => setQ("")}
              style={{ background: "none", border: 0, color: "var(--tx-3)", cursor: "pointer" }}
            >
              <Icon.close size={20} />
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
          {chips.map((c) => (
            <button
              key={c}
              className={"chip" + (ql === c.toLowerCase() ? " on" : "")}
              onClick={() => setQ(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {!q.trim() ? (
          <div
            style={{
              textAlign: "center",
              padding: 90,
              color: "var(--tx-3)",
              fontWeight: 300,
              fontSize: 22,
            }}
          >
            Search tracks, artists &amp; albums…
          </div>
        ) : loading ? (
          <div
            style={{
              textAlign: "center",
              padding: 90,
              color: "var(--tx-3)",
              fontWeight: 300,
              fontSize: 22,
            }}
          >
            Searching “{q}”…
          </div>
        ) : !tracks.length && !artists.length && !albums.length ? (
          <div
            style={{
              textAlign: "center",
              padding: 90,
              color: "var(--tx-3)",
              fontWeight: 300,
              fontSize: 22,
            }}
          >
            Nothing for “{q}”…
          </div>
        ) : (
          <div
            style={{
              marginTop: 40,
              display: "grid",
              gridTemplateColumns: "minmax(280px, 0.9fr) 1.1fr",
              gap: 48,
            }}
          >
            {/* top result */}
            <div>
              <div className="sech">
                <h2 style={{ fontSize: 22 }}>Top result</h2>
              </div>
              {top && (
                <button
                  onClick={(e) => {
                    const a = e.currentTarget.querySelector(".grain");
                    const r = (a || e.currentTarget).getBoundingClientRect();
                    const run = () => openArtist(top);
                    if (window.__MORPH)
                      window.__MORPH(r, top.coverSeed, top.gradient, run, top.image);
                    else run();
                  }}
                  className="grain rise"
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
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      boxShadow: "0 12px 30px rgba(0,0,0,.5)",
                    }}
                    mono
                  />
                  <div style={{ fontSize: 30, fontWeight: 300, marginTop: 20 }}>{top.name}</div>
                  <span className="tag" style={{ marginTop: 14, display: "inline-block" }}>
                    Artist
                  </span>
                </button>
              )}
            </div>
            {/* songs */}
            <div>
              <div className="sech">
                <h2 style={{ fontSize: 22 }}>Songs</h2>
              </div>
              {tracks.slice(0, 6).map((t: any, i: number) => (
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
                />
              ))}
            </div>
          </div>
        )}

        {artists.length > 0 && (
          <section style={{ marginTop: 44 }}>
            <div className="sech">
              <h2>Artists</h2>
            </div>
            <div className="hrail">
              {artists.map((a: any) => (
                <MediaCard
                  key={a.id}
                  round
                  title={a.name}
                  sub="Artist"
                  seed={a.coverSeed}
                  grad={a.gradient}
                  image={a.image}
                  onClick={() => openArtist(a)}
                />
              ))}
            </div>
          </section>
        )}
        {albums.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <div className="sech">
              <h2>Albums</h2>
            </div>
            <div className="hrail">
              {albums.map((al: any) => (
                <MediaCard
                  key={al.id}
                  title={al.name}
                  sub={al.artist}
                  seed={al.coverSeed}
                  grad={al.gradient}
                  image={al.image}
                  onClick={() => openAlbum(al)}
                  onPlay={() => openAlbum(al)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ---------- CHARTS ----------
type ChartCardProps = {
  title: any;
  time: any;
  seed: any;
  grad: any;
  image?: string;
  onClick: (...args: any[]) => void;
};

function ChartCard({ title, time, seed, grad, image, onClick }: ChartCardProps) {
  const handle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (window.__MORPH) window.__MORPH(r, seed, grad, onClick, image);
    else onClick();
  };
  return (
    <button
      onClick={handle}
      onMouseEnter={() => window.__AMBIENT?.(seed, grad)}
      onFocus={() => window.__AMBIENT?.(seed, grad)}
      className="grain"
      style={{
        position: "relative",
        border: 0,
        cursor: "pointer",
        overflow: "hidden",
        color: "#fff",
        minHeight: 200,
        background: artBg(seed, grad),
        textAlign: "left",
        padding: 0,
        borderRadius: "var(--r-md)",
      }}
    >
      {image && (
        <img
          src={image}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 1,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background: "linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.58))",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 3,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 30px",
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 300,
            letterSpacing: ".02em",
            textShadow: "0 2px 16px rgba(0,0,0,.5)",
          }}
        >
          {title}
        </div>
        <div
          style={{ width: 64, height: 2, background: "rgba(255,255,255,.85)", margin: "16px 0" }}
        />
        <div className="mlabel" style={{ opacity: 0.8 }}>
          {time}
        </div>
      </div>
    </button>
  );
}

type ChartsScreenProps = {
  data: any;
  onOpenChart: (...args: any[]) => void;
};

export function ChartsScreen({ data, onOpenChart }: ChartsScreenProps) {
  return (
    <div
      className="fade-in scroll"
      style={{
        height: "100%",
        background: "radial-gradient(120% 90% at 50% 0%, #16161d, var(--surf-0))",
      }}
    >
      <div style={{ padding: "60px 40px 40px" }}>
        <div style={{ fontSize: 36, fontWeight: 200, marginBottom: 6 }}>Charts</div>
        <div className="mlabel" style={{ color: "var(--tx-3)", marginBottom: 26 }}>
          Ranked by plays · refreshed daily
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {((data.charts?.length ? data.charts : MOCK.charts) as any[]).map((c: any, i: number) => (
            <div key={c.id} className="rise" style={{ animationDelay: i * 0.05 + "s" }}>
              <ChartCard
                title={c.title}
                time={c.updatedAt ? "Updated " + c.updatedAt : "Top chart"}
                seed={c.coverSeed ?? c.seed}
                grad={c.gradient}
                image={c.image}
                onClick={() => onOpenChart(c)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- LIBRARY (core-taxonomy hub) ----------
// Compact list row — the high-density alternative to the card grid.
type CollectionRowProps = {
  name: any;
  sub: any;
  meta?: any;
  seed: any;
  grad: any;
  image?: string;
  round?: boolean;
  onOpen: (...args: any[]) => void;
  onPlay?: (...args: any[]) => void;
  item?: any;
};

export function CollectionRow({
  name,
  sub,
  meta,
  seed,
  grad,
  image,
  round,
  onOpen,
  onPlay,
  item,
}: CollectionRowProps) {
  const [hover, setHover] = useState(false);
  const handle = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = e.currentTarget.querySelector(".clrt");
    const r = (a || e.currentTarget).getBoundingClientRect();
    if (window.__MORPH) window.__MORPH(r, seed, grad, onOpen, image);
    else onOpen();
  };
  return (
    <div
      onMouseEnter={() => {
        setHover(true);
        window.__AMBIENT?.(seed, grad);
      }}
      onMouseLeave={() => setHover(false)}
      onClick={handle}
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- div serves as interactive row container
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handle(e as any);
        }
      }}
      onContextMenu={item ? (e) => window.__COLLMENU?.(e, item) : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "9px 14px",
        cursor: "pointer",
        background: hover ? "rgba(255,255,255,.06)" : "transparent",
        transition: "background .15s",
        borderRadius: 8,
      }}
    >
      <div style={{ position: "relative", flex: "0 0 auto" }}>
        <Art
          className="clrt"
          seed={seed}
          grad={grad}
          image={image}
          mono={round}
          style={{ width: 48, height: 48, borderRadius: round ? "50%" : 4 }}
        />
        {onPlay && hover && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            aria-label="Play"
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: "rgba(0,0,0,.42)",
              border: 0,
              color: "#fff",
              cursor: "pointer",
              borderRadius: round ? "50%" : 4,
            }}
          >
            <Icon.play size={18} />
          </button>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 400,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 300, color: "rgba(255,255,255,.5)" }}>{sub}</div>
      </div>
      {meta && (
        <span
          className="mlabel"
          style={{ color: "rgba(255,255,255,.4)", fontSize: 11, flex: "0 0 auto" }}
        >
          {meta}
        </span>
      )}
    </div>
  );
}

// Cover Flow is now a VIEW MODE (grid / list / flow) applied to any
// collection — not a content category. See LibraryScreen below.

type LibraryScreenProps = {
  data: any;
  onPlay: (...args: any[]) => void;
  current: any;
  playing: any;
  accent: any;
  openPlaylist: (...args: any[]) => void;
  openAlbum: (...args: any[]) => void;
  openArtist: (...args: any[]) => void;
  liked: any;
  toggleLike: (...args: any[]) => void;
  initialTab?: any;
  initialView?: any;
};

export function LibraryScreen({
  data,
  onPlay,
  current,
  playing,
  accent,
  openPlaylist,
  openAlbum,
  openArtist,
  liked,
  toggleLike,
  initialTab,
  initialView,
}: LibraryScreenProps) {
  const [tab, setTab] = useState(initialTab || "playlists");
  const [view, setView] = useState(initialView || "grid"); // grid | list | flow
  const [flowCenter, setFlowCenter] = useState(2);
  useEffect(() => {
    setFlowCenter(2);
  }, [tab]); // recentre the flow per collection
  const tracks = data.allTracks;
  const half = Math.ceil(tracks.length / 2);
  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(176px, 1fr))",
    gap: 24,
    justifyItems: "start",
  };
  const cardTab = tab === "playlists" || tab === "albums" || tab === "artists";

  // the active collection, normalised so grid / list / flow share one source
  const coll =
    tab === "albums"
      ? data.albums?.length
        ? data.albums
        : MOCK.albums
      : tab === "artists"
        ? data.artists?.length
          ? data.artists
          : MOCK.artists
        : data.playlists?.length
          ? data.playlists
          : MOCK.playlists;
  const openOf = (o: any) =>
    tab === "albums" ? openAlbum(o) : tab === "artists" ? openArtist(o) : openPlaylist(o);
  const tracksOf = (o: any) =>
    tab === "artists" ? tracks.filter((t: any) => t.artistId === o.id) : o.tracks || [];
  const subOf = (o: any) =>
    tab === "albums" ? o.artist : tab === "artists" ? "" : o.kind || "Playlist";
  const metaOf = (o: any) =>
    tab === "albums"
      ? o.year + " · " + (o.tracks ? o.tracks.length : 0) + " tracks"
      : tab === "artists"
        ? ""
        : (o.tracks ? o.tracks.length : 0) + " tracks";
  const round = tab === "artists";
  const flowItems = coll.map((o: any) => ({
    id: "fl-" + o.id,
    name: o.name,
    sub: subOf(o),
    seed: o.coverSeed,
    grad: o.gradient,
    image: o.image,
    obj: o,
  }));

  const flowMode = cardTab && view === "flow";
  return (
    <div
      className={flowMode ? "fade-in" : "fade-in scroll"}
      style={{
        height: "100%",
        overflow: flowMode ? "hidden" : undefined,
        display: "flex",
        flexDirection: "column",
        background: "radial-gradient(120% 80% at 70% -5%, #15161d, var(--surf-0))",
      }}
    >
      <div
        style={{
          padding: flowMode ? "60px 48px 0" : "60px 48px 40px",
          flex: flowMode ? "0 0 auto" : "1",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 200, marginBottom: 22 }}>Your Library</div>
        <div className="tabs" style={{ marginBottom: 30 }}>
          {[
            ["playlists", "Playlists"],
            ["albums", "Albums"],
            ["artists", "Artists"],
            ["songs", "Songs"],
          ].map(([k, l]) => (
            <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
          {cardTab && (
            <div
              className="viewtoggle"
              style={{ marginLeft: "auto", transform: "translateY(-8px)" }}
            >
              <button
                className={view === "grid" ? "on" : ""}
                onClick={() => setView("grid")}
                aria-label="Grid view"
              >
                <Icon.grid size={17} />
              </button>
              <button
                className={view === "list" ? "on" : ""}
                onClick={() => setView("list")}
                aria-label="List view"
              >
                <Icon.list size={17} />
              </button>
              <button
                className={view === "flow" ? "on" : ""}
                onClick={() => setView("flow")}
                aria-label="Cover flow view"
              >
                <Icon.flow size={17} />
              </button>
            </div>
          )}
        </div>

        <div
          key={tab + view}
          className="xfade"
          style={
            flowMode
              ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }
              : undefined
          }
        >
          {cardTab && view === "flow" && (
            <div style={{ flex: 1, minHeight: 0, margin: "0 -48px" }}>
              <CoverFlow
                items={flowItems}
                center={Math.min(flowCenter, flowItems.length - 1)}
                setCenter={setFlowCenter}
                accent={accent}
                onOpen={(it: any) => openOf(it.obj)}
                onPlay={(it: any) => {
                  const ts = tracksOf(it.obj);
                  if (ts[0]) onPlay(ts[0]);
                }}
                tracksFor={(it: any) => tracksOf(it.obj)}
                onPlayTrack={onPlay}
              />
            </div>
          )}
          {cardTab && view === "grid" && (
            <div style={grid}>
              {coll.map((o: any) => (
                <MediaCard
                  key={o.id}
                  round={round}
                  title={o.name}
                  sub={subOf(o)}
                  seed={o.coverSeed}
                  grad={o.gradient}
                  image={o.image}
                  item={o}
                  onClick={() => openOf(o)}
                  onPlay={tab === "artists" ? undefined : () => openOf(o)}
                />
              ))}
            </div>
          )}
          {cardTab && view === "list" && (
            <div>
              {coll.map((o: any) => (
                <CollectionRow
                  key={o.id}
                  round={round}
                  name={o.name}
                  sub={subOf(o)}
                  meta={metaOf(o)}
                  seed={o.coverSeed}
                  grad={o.gradient}
                  image={o.image}
                  item={o}
                  onOpen={() => openOf(o)}
                  onPlay={() => openOf(o)}
                />
              ))}
            </div>
          )}
          {tab === "songs" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 40 }}>
              <div>
                {tracks.slice(0, half).map((t: any, i: number) => (
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
                  />
                ))}
              </div>
              <div>
                {tracks.slice(half).map((t: any, i: number) => (
                  <TrackRow
                    key={t.id}
                    track={t}
                    index={half + i + 1}
                    onPlay={onPlay}
                    current={current}
                    playing={playing}
                    liked={liked}
                    toggleLike={toggleLike}
                    accent={accent}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
