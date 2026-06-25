// ============================================================
// Sonance Vibe — Shell
// Resident shell + shared-element transition engine, ported verbatim from the
// example Sonance Vibe.html App. The phase machine (trans / startForward /
// startReverse / morph layers) is unchanged; only MOCK playback became the real kernel.
//
// The morph engine, spatial navigation, context menu, and likes/history state
// have been extracted into dedicated hooks for clarity.
// Shell remains the composition root: it owns navigation state, data fetching
// (openDetail / openArtist), the XMB category model, and screen rendering.
// ============================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useActiveProvider } from "@/hooks/useActiveProvider";

import { artBg, Equalizer, Icon } from "./primitives";
import { MOCK } from "./mockCatalog";
import { RepeatMode } from "@core/plugin/playqueue/repeat";
import { useCatalog, useLyric, useProviderSearch, useToplists, useVibePlayback } from "./hooks";
import { toVibeAlbum, toVibeArtist, toVibePlaylist, toVibeTracks, type VibeTrack } from "./adapt";
import { useLikes } from "./useLikes";
import { useMorphTransition } from "./useMorphTransition";
import { useSpatialNavigation } from "./useSpatialNavigation";
import { useContextMenu } from "./useContextMenu";

import { PlayerBar } from "./PlayerBar";
import { XMB } from "./XMB";
import { ForYouScreen } from "./ForYou";
import { NowPlaying } from "./NowPlaying";
// ContextMenu is only shown on right-click — lazy-load to keep it out of the main bundle.
const LazyContextMenu = React.lazy(() =>
  import("./Menu").then((m) => ({ default: m.ContextMenu })),
);
import { SearchScreen, ChartsScreen, LibraryScreen } from "./Browse";
import { PlaylistDetailScreen, QueueScreen, HistoryScreen, SettingsScreen } from "./Detail";
import { ArtistScreen, ProfileScreen, BrowseScreen, CommentsScreen } from "./Pages";

const ACCENTS = ["#0fff83", "#ff2188", "#19d3c5", "#ff5a3c", "#7a5cff"];

// Placeholder track before playback starts, so the bar and screens read defined fields, not undefined.
const PLACEHOLDER_TRACK: VibeTrack = {
  id: "",
  title: "Not playing",
  name: "Not playing",
  artist: "",
  coverSeed: 0,
  durSec: 0,
  duration: "0:00",
};

// One frame of navigation state — enough to rebuild any screen on "back".
// Screen rendering reads several independent Shell state slices (detail /
// artistObj / library tab+view / search seed), so a back-stack entry must
// snapshot all of them, not just the `view` string.
type NavSnapshot = {
  view: string;
  detail: any;
  artistObj: any;
  libraryTab: string;
  libraryView: string;
  searchQuery: string;
  playContext: VibeTrack[];
};

export default function Shell() {
  const provider = useActiveProvider();
  const queryClient = useQueryClient();

  /* ---- theme tweaks (example TweaksPanel knobs; fixed here, accent editable in Settings) ---- */
  const [accent, setAccent] = useState("#0fff83");
  // "color", never "mono": a greyscale portrait reads as a memorial photo
  // (遗照) in Chinese culture — never desaturate a living artist's photo.
  const [heroTreatment] = useState<"mono" | "color">("color");
  const [glass] = useState(30);
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--glass-blur", glass + "px");
  }, [accent, glass]);

  /* ---- navigation / view state (kept as-is) ---- */
  const [view, setView] = useState("xmb");
  const [xmbCategory, setXmbCategory] = useState(1);
  const [xmbRowByCategory, setXmbRowByCategory] = useState<Record<string, number>>({});
  const [detail, setDetail] = useState<any>(null);
  const [artistObj, setArtistObj] = useState<any>(MOCK.artists[0]);
  const [searchQuery, setSeedQuery] = useState("");
  const [libraryTab, setLibraryTab] = useState("playlists");
  const [libraryView, setLibraryView] = useState("grid");

  /* ---- back-stack: each forward hop remembers the screen it left, so "back"
     pops one level instead of always collapsing to the XMB launcher. The
     launcher boundary itself stays the morph engine's job (startReverse), so
     we never push "xmb" — an empty stack means "morph home". Held in a ref:
     it only drives the goBack branch, never rendering. ---- */
  const navStack = useRef<NavSnapshot[]>([]);
  const navSnapRef = useRef<NavSnapshot | null>(null);

  /* ---- real kernel playback state (replaces the example MOCK + local useState) ---- */
  const playback = useVibePlayback();
  // Destructure stable callbacks from playback (they are useCallback-ed in hooks.ts)
  const {
    play: playFn,
    togglePlay,
    toggleShuffle,
    toggleRepeat,
    next: playNextFn,
    prev: playPrevFn,
  } = playback;

  const current = playback.current ?? PLACEHOLDER_TRACK;
  const playing = playback.playing;
  const shuffle = playback.shuffle;
  const repeat = playback.repeat !== RepeatMode.OFF;
  const queue = playback.upNext;
  const setPlaying = useCallback(() => togglePlay(), [togglePlay]);
  const setShuffle = useCallback(() => toggleShuffle(), [toggleShuffle]);
  const onToggleRepeat = useCallback(() => toggleRepeat(), [toggleRepeat]);
  const playNext = useCallback(() => playNextFn(), [playNextFn]);
  const playPrev = useCallback(() => playPrevFn(), [playPrevFn]);

  /* Current playable context (filled once a detail/artist loads); onPlay(track) plays within this list. */
  const playContext = useRef<VibeTrack[]>([]);
  const onPlay = useCallback(
    (track: VibeTrack | undefined) => {
      if (!track) return;
      const ctx = playContext.current;
      // Use the context list as the queue only when it actually contains this track; otherwise play the single track (e.g. a search result).
      const list = ctx?.length && ctx.some((t) => t.id === track.id) ? ctx : [track];
      playFn(list, track);
    },
    [playFn],
  );

  /* Mirror the live navigation state so a back-stack push captures the screen
     being left without stale closures (safe to write during render: pure mirror). */
  navSnapRef.current = {
    view,
    detail,
    artistObj,
    libraryTab,
    libraryView,
    searchQuery,
    playContext: playContext.current,
  };
  // Remember the current screen before a forward hop. No-op at the launcher:
  // the XMB↔screen boundary is the morph engine's (startReverse), not the stack's.
  const pushCurrent = useCallback(() => {
    const snap = navSnapRef.current;
    if (!snap || snap.view === "xmb") return;
    navStack.current.push(snap);
  }, []);
  // Forward navigation to a bare view: push the current screen, then switch.
  const navigate = useCallback(
    (v: string) => {
      pushCurrent();
      setView(v);
    },
    [pushCurrent],
  );

  /* ---- catalog / charts / search (real provider) ---- */
  const { catalog } = useCatalog();
  const toplists = useToplists();
  const search = useProviderSearch();
  const screenData = useMemo(
    () => ({
      ...catalog.data,
      playlists: catalog.playlists.length ? catalog.playlists : MOCK.playlists,
      albums: catalog.albums.length ? catalog.albums : MOCK.albums,
      artists: catalog.artists.length ? catalog.artists : MOCK.artists,
      allTracks: catalog.data.allTracks.length ? catalog.data.allTracks : MOCK.data.allTracks,
    }),
    [catalog],
  );

  /* ---- likes / settings / history (extracted hook) ---- */
  const { liked, toggleLike, isLiked, history, settings, setSettings } = useLikes(playback.current);

  // Real lyrics ([] when none; NowPlaying shows "No lyrics" on its own).
  const realLyrics = useLyric(playback.current?.id);
  const lyrics = realLyrics.length ? realLyrics : [];

  /* ---- open detail: fetch the real collection async (switch screen + skeleton now, backfill tracks when data lands) ---- */
  const openDetail = useCallback(
    (obj: any) => {
      pushCurrent();
      // Detail screens assume tracks is always an array (they read p.tracks.length); a summary (charts especially) may lack it, so default it.
      obj = { ...obj, tracks: obj?.tracks ?? [] };
      setDetail(obj);
      playContext.current = obj.tracks;
      setView("detail");
      // Real playlist/collection summaries carry no tracks -> fetch detail to backfill.
      if (obj?.id && obj?._real !== false && (!obj.tracks || obj.tracks.length === 0)) {
        const kind = obj.kind;
        const fetcher =
          kind === "Album"
            ? () => provider.albumDetail(obj.id).then(toVibeAlbum)
            : kind === "Chart"
              ? () => provider.toplistDetail(obj.id).then(toVibePlaylist)
              : () => provider.playlistDetail(obj.id).then(toVibePlaylist);
        queryClient
          .fetchQuery({ queryKey: ["detail", kind, provider.name, obj.id], queryFn: fetcher })
          .then((full: any) => {
            // full (detail) is the base; keep summary name/image/coverSeed/kind when detail lacks them (charts especially).
            const merged: any = { ...obj, ...full };
            if (!merged.name) merged.name = obj.name;
            if (!merged.image) merged.image = obj.image;
            merged.coverSeed = obj.coverSeed ?? merged.coverSeed;
            merged.kind = obj.kind ?? merged.kind;
            if (!merged.tracks?.length) merged.tracks = obj.tracks ?? [];
            playContext.current = merged.tracks ?? [];
            setDetail(merged);
          })
          .catch(() => {});
      }
    },
    [provider, queryClient, pushCurrent],
  );
  const albumDetail = useCallback((al: any) => openDetail({ ...al, kind: "Album" }), [openDetail]);
  const openChart = useCallback(
    (c: any) => openDetail({ ...c, kind: "Chart", _real: true }),
    [openDetail],
  );
  const openArtist = useCallback(
    (ar: any) => {
      pushCurrent();
      setArtistObj(ar);
      playContext.current = ar?.tracks ?? [];
      setView("artist");
      if (ar?.id && (!ar.tracks || ar.tracks.length === 0)) {
        queryClient
          .fetchQuery({
            queryKey: ["artist", provider.name, ar.id],
            queryFn: () => provider.artistDetail(ar.id),
          })
          .then((full) => {
            const mapped: any = toVibeArtist(full);
            mapped.tracks = toVibeTracks(full.topTracks);
            playContext.current = mapped.tracks;
            setArtistObj(mapped);
          })
          .catch(() => {});
      }
    },
    [provider, queryClient, pushCurrent],
  );
  const openGenre = useCallback(
    (name?: string) => {
      pushCurrent();
      setSeedQuery(name || "");
      setView("search");
    },
    [pushCurrent],
  );
  const openLib = useCallback(
    (tab: string, vw?: string) => {
      pushCurrent();
      setLibraryTab(tab);
      setLibraryView(vw || "grid");
      setView("library");
    },
    [pushCurrent],
  );
  const likedDetail = useCallback(
    () =>
      openDetail({
        name: "Liked Songs",
        kind: "Playlist",
        owner: "You",
        coverSeed: 0,
        gradient: ["#2a0420", "#ff4fa3"],
        _real: false,
        description: "Everything you've hearted, in one place.",
        tracks: screenData.allTracks.filter((t: any) => liked.has(t.id)),
      }),
    [openDetail, screenData, liked],
  );

  /* ---- right-click context menu (extracted hook) ---- */
  const { menu, setMenu } = useContextMenu({ onPlay, openDetail, openArtist, toggleLike, liked });

  /* ---- shared-element transition engine (extracted hook) ---- */
  const viewRef = useRef<HTMLDivElement | null>(null);
  const { trans, startForward, startReverse, layerStyle, EASE } = useMorphTransition(
    viewRef,
    view,
    setView,
  );

  /* Back: pop one screen off the stack and restore its full data snapshot;
     when the stack is empty we're at a launcher-level screen, so hand off to
     the morph engine to collapse home. */
  const goBack = useCallback(() => {
    const prev = navStack.current.pop();
    if (!prev) {
      startReverse();
      return;
    }
    setView(prev.view);
    setDetail(prev.detail);
    setArtistObj(prev.artistObj);
    setLibraryTab(prev.libraryTab);
    setLibraryView(prev.libraryView);
    setSeedQuery(prev.searchQuery);
    playContext.current = prev.playContext;
  }, [startReverse]);

  /* Esc backs out one level (was the morph hook's job; centralised here so it
     shares the back-stack instead of always jumping to the launcher). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && view !== "xmb") goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, goBack]);

  /* ---- arrow-key spatial navigation (extracted hook) ---- */
  useSpatialNavigation(viewRef, view, goBack);

  const npView = view === "np";
  const homeView = view === "xmb";

  /* ==========================================================================
     XMB model -- built from the real catalog + static categories (mirrors the example domain partitions)
     ========================================================================== */
  const cats = useMemo(() => {
    const pls = screenData.playlists;
    const als = screenData.albums;
    const ars = screenData.artists;
    return [
      // 1 · CONSUMPTION
      {
        id: "np",
        icon: "play",
        label: "Now Playing",
        items: [
          {
            key: "cover",
            label: current?.title || "Now Playing",
            sub: current?.artist,
            icon: "play",
            seed: current?.coverSeed || 0,
            grad: current?.gradient,
            image: current?.image,
            dest: "np",
            run: () => setView("np"),
          },
          {
            key: "lyrics",
            label: "Lyrics",
            sub: "Synced lyrics",
            seed: (current?.coverSeed || 0) + 1,
            grad: current?.gradient,
            dest: "np",
            run: () => setView("np"),
          },
          {
            key: "queue",
            label: "Up Next",
            sub: queue.length + " tracks queued",
            icon: "list",
            seed: 5,
            dest: "queue",
            run: () => setView("queue"),
          },
          {
            key: "comments",
            label: "Hot Comments",
            sub: "On " + (current?.title || ""),
            icon: "comment",
            seed: 8,
            dest: "comments",
            run: () => setView("comments"),
          },
          {
            key: "history",
            label: "History",
            sub: "Recently played",
            icon: "clock",
            seed: 12,
            grad: ["#161320", "#8a7bff"],
            dest: "history",
            run: () => setView("history"),
          },
        ],
      },
      // 2 · ORGANIZATION — playlists
      {
        id: "foryou",
        icon: "star",
        label: "For You",
        items: [
          {
            key: "overview",
            label: "Overview",
            sub: "Your daily landing",
            icon: "note",
            seed: 7,
            grad: ["#1b1033", "#ff2188"],
            dest: "home",
            run: () => setView("home"),
          },
          ...pls.slice(0, 6).map((p: any) => ({
            key: p.id,
            label: p.name,
            sub: "Made for you",
            seed: p.coverSeed,
            grad: p.gradient,
            image: p.image,
            dest: "detail",
            run: () => openDetail(p),
          })),
        ],
      },
      // 3 · ORGANIZATION — charts (real charts)
      {
        id: "charts",
        icon: "bars",
        label: "Charts",
        items: [
          ...(toplists.length ? toplists : MOCK.charts).slice(0, 4).map((c: any) => ({
            key: c.id,
            label: c.title,
            sub: c.updatedAt ? "Updated " + c.updatedAt : "Top chart",
            icon: "bars",
            seed: c.coverSeed ?? c.seed,
            grad: c.gradient,
            image: c.image,
            dest: "detail",
            run: () => (c.coverSeed != null ? openChart(c) : setView("charts")),
          })),
          {
            key: "all",
            label: "All charts",
            sub: "Browse grid",
            icon: "grid",
            seed: 10,
            grad: ["#240b04", "#ff8a3c"],
            dest: "charts",
            run: () => setView("charts"),
          },
        ],
      },
      // 4 · ORGANIZATION — radio (static)
      {
        id: "radio",
        icon: "radio",
        label: "Radio",
        items: MOCK.radios.map((r: any) => ({
          key: r.id,
          label: r.title,
          sub: r.sub,
          icon: r.type === "podcast" ? "volume" : "radio",
          seed: r.seed,
          grad: r.gradient,
          dest: "browse",
          run: () => setView("browse"),
        })),
      },
      // 5 · USER — library
      {
        id: "library",
        icon: "stack",
        label: "Library",
        items: [
          {
            key: "liked",
            label: "Liked Songs",
            sub: liked.size + " tracks",
            icon: "heart",
            seed: 0,
            grad: ["#2a0420", "#ff4fa3"],
            dest: "detail",
            run: likedDetail,
          },
          {
            key: "playlists",
            label: "Your Playlists",
            sub: pls.length + " playlists",
            icon: "list",
            seed: 1,
            grad: ["#1a0d3a", "#7755ff"],
            dest: "library",
            run: () => openLib("playlists"),
          },
          {
            key: "albums",
            label: "Saved Albums",
            sub: als.length + " albums",
            icon: "stack",
            seed: 2,
            grad: ["#3a0d10", "#f3727f"],
            dest: "library",
            run: () => openLib("albums"),
          },
          {
            key: "following",
            label: "Following",
            sub: ars.length + " artists",
            icon: "user",
            seed: 4,
            grad: ["#06222b", "#19d3c5"],
            dest: "library",
            run: () => openLib("artists"),
          },
          {
            key: "flow",
            label: "Cover Flow",
            sub: "Flip through your albums",
            icon: "flow",
            seed: 6,
            grad: ["#06222b", "#19d3c5"],
            dest: "library",
            run: () => openLib("albums", "flow"),
          },
        ],
      },
      // 6 · CLASSIFICATION — browse facets (static)
      {
        id: "browse",
        icon: "compass",
        label: "Browse",
        items: [
          {
            key: "lang",
            label: "Languages",
            sub: "Mandarin · Western · J-Pop · K-Pop",
            icon: "grid",
            seed: 5,
            grad: ["#13031f", "#b15cff"],
            dest: "browse",
            run: () => setView("browse"),
          },
          {
            key: "genre",
            label: "Genres",
            sub: "Pop · Rock · Electronic · Jazz",
            seed: 2,
            grad: ["#0b1b3a", "#5b8cff"],
            dest: "browse",
            run: () => setView("browse"),
          },
          {
            key: "scene",
            label: "Scenes",
            sub: "Commute · Workout · Study · Sleep",
            seed: 6,
            grad: ["#240b04", "#ff8a3c"],
            dest: "browse",
            run: () => setView("browse"),
          },
          {
            key: "mood",
            label: "Moods",
            sub: "Calm · Happy · Melancholy · Hype",
            seed: 8,
            grad: ["#0a3a2a", "#1ed760"],
            dest: "browse",
            run: () => setView("browse"),
          },
        ],
      },
      // 7 · RETRIEVAL — search
      {
        id: "search",
        icon: "search",
        label: "Search",
        items: [
          {
            key: "open",
            label: "Search music",
            sub: "Tracks, artists, albums",
            icon: "search",
            seed: 6,
            grad: ["#021e24", "#36c5e0"],
            dest: "search",
            run: () => {
              setSeedQuery("");
              setView("search");
            },
          },
        ],
      },
      // 8 · USER — account
      {
        id: "you",
        icon: "user",
        label: "You",
        items: [
          {
            key: "profile",
            label: "Profile",
            sub: "You",
            icon: "user",
            seed: 3,
            grad: ["#1b1033", "#ff2188"],
            dest: "profile",
            run: () => setView("profile"),
          },
          {
            key: "stats",
            label: "Listening",
            sub: "Your top artists & minutes",
            icon: "bars",
            seed: 9,
            grad: ["#2a0420", "#ff4fa3"],
            dest: "profile",
            run: () => setView("profile"),
          },
        ],
      },
      // 9 · SYSTEM — settings
      {
        id: "settings",
        icon: "gear",
        label: "Settings",
        items: [
          {
            key: "prefs",
            label: "Preferences",
            sub: "Audio, theme, interface",
            icon: "gear",
            seed: 9,
            grad: ["#13031f", "#b15cff"],
            dest: "settings",
            run: () => setView("settings"),
          },
          {
            key: "about",
            label: "About Sonance",
            sub: "Version 2.0",
            seed: 2,
            dest: "settings",
            run: () => setView("settings"),
          },
        ],
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cats intentionally curates deps; the referenced callbacks (openDetail, openChart, openLib, likedDetail) are now memoized and stable, so they don't need to be deps here.
  }, [current, queue, liked, screenData, toplists]);

  /* ==========================================================================
     render screen
     ========================================================================== */
  const renderScreen = (v: string) => {
    if (v === "xmb")
      return (
        <XMB
          cats={cats}
          accent={accent}
          playing={playing}
          showWaves={settings.waves}
          onOpen={startForward}
          cState={xmbCategory}
          setCState={setXmbCategory}
          rowsState={xmbRowByCategory}
          setRowsState={setXmbRowByCategory}
        />
      );
    if (v === "home")
      return (
        <ForYouScreen
          data={screenData}
          onPlay={onPlay}
          accent={accent}
          openPlaylist={openDetail}
          openAlbum={albumDetail}
          openArtist={openArtist}
          onNav={navigate}
        />
      );
    if (v === "search")
      return (
        <SearchScreen
          data={screenData}
          onPlay={onPlay}
          current={current}
          playing={playing}
          accent={accent}
          initialQuery={searchQuery}
          liked={liked}
          toggleLike={toggleLike}
          openArtist={openArtist}
          openAlbum={albumDetail}
          openPlaylist={openDetail}
          search={search}
        />
      );
    if (v === "charts") return <ChartsScreen data={{ charts: toplists }} onOpenChart={openChart} />;
    if (v === "library" || v === "made")
      return (
        <LibraryScreen
          key={libraryTab + libraryView}
          initialTab={libraryTab}
          initialView={libraryView}
          data={screenData}
          onPlay={onPlay}
          current={current}
          playing={playing}
          accent={accent}
          openPlaylist={openDetail}
          openAlbum={albumDetail}
          openArtist={openArtist}
          liked={liked}
          toggleLike={toggleLike}
        />
      );
    if (v === "detail" && detail)
      return (
        <PlaylistDetailScreen
          playlist={detail}
          onPlay={onPlay}
          current={current}
          playing={playing}
          liked={liked}
          toggleLike={toggleLike}
          accent={accent}
          onOpenArtist={openArtist}
        />
      );
    if (v === "queue")
      return (
        <QueueScreen
          current={current}
          queue={queue}
          onPlay={onPlay}
          playing={playing}
          liked={liked}
          toggleLike={toggleLike}
          accent={accent}
          onOpenArtist={openArtist}
        />
      );
    if (v === "history")
      return (
        <HistoryScreen
          history={history}
          all={screenData.allTracks}
          onPlay={onPlay}
          current={current}
          playing={playing}
          liked={liked}
          toggleLike={toggleLike}
          accent={accent}
          onOpenArtist={openArtist}
        />
      );
    if (v === "settings")
      return (
        <SettingsScreen
          accent={accent}
          setAccent={setAccent}
          accentOptions={ACCENTS}
          settings={settings}
          setSettings={setSettings}
        />
      );
    if (v === "artist")
      return (
        <ArtistScreen
          artist={artistObj}
          tracks={artistObj?.tracks ?? []}
          albums={[]}
          similar={screenData.artists.filter((a: any) => a.id !== artistObj?.id)}
          onPlay={onPlay}
          current={current}
          playing={playing}
          liked={liked}
          toggleLike={toggleLike}
          accent={accent}
          mono={heroTreatment === "mono"}
          onOpenAlbum={albumDetail}
          onOpenArtist={openArtist}
        />
      );
    if (v === "profile")
      return (
        <ProfileScreen
          accent={accent}
          playlists={screenData.playlists}
          onOpenPlaylist={openDetail}
          onPlay={onPlay}
          mono={heroTreatment === "mono"}
        />
      );
    if (v === "browse") return <BrowseScreen accent={accent} onOpenGenre={openGenre} />;
    if (v === "comments")
      return (
        <CommentsScreen
          track={current}
          accent={accent}
          liked={isLiked}
          toggleLike={() => current && toggleLike(current.id)}
          mono={heroTreatment === "mono"}
        />
      );
    if (v === "np")
      return (
        <NowPlaying
          track={current}
          accent={accent}
          liked={isLiked}
          toggleLike={() => current && toggleLike(current.id)}
          lyrics={lyrics}
          mono={heroTreatment === "mono"}
          queue={queue}
          onPlay={onPlay}
          current={current}
          onNext={playNext}
          onPrev={playPrev}
          progressSec={playback.progress.duration}
          initialMode={settings.npMode === "LYRICS" ? "lyrics" : "cover"}
          onClose={goBack}
          onOpenArtist={openArtist}
        />
      );
    return null;
  };

  // No native frame: the faux traffic lights take over real window controls; a draggable strip at the top moves the window.
  const wails = () => (window as any).runtime;
  const dragStyle = { "--wails-draggable": "drag" } as React.CSSProperties;
  const noDragStyle = { "--wails-draggable": "no-drag" } as React.CSSProperties;

  return (
    <div className="win-stage">
      <div className="win">
        {/* top drag strip (spans the top; traffic-light and tool buttons above it stay clickable) */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 30,
            zIndex: 55,
            ...dragStyle,
          }}
        />

        <div className="traffic" style={noDragStyle}>
          {(
            [
              ["r", "Close", () => wails()?.Quit?.()],
              ["y", "Minimise", () => wails()?.WindowMinimise?.()],
              ["g", "Maximise", () => wails()?.WindowToggleMaximise?.()],
            ] as const
          ).map(([cls, label, action]) => (
            <i
              key={cls}
              // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
              role="button"
              tabIndex={0}
              aria-label={label}
              className={cls}
              style={{ cursor: "pointer" }}
              onClick={action}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  action();
                }
              }}
              title={label}
            />
          ))}
        </div>

        {!npView && (
          <div className="win-tools" style={noDragStyle}>
            {!homeView && (
              <button onClick={goBack} aria-label="Menu">
                <Icon.back size={20} />
              </button>
            )}
            <button onClick={() => navigate("np")} aria-label="Now playing">
              <Equalizer playing={playing} color="currentColor" size={18} />
            </button>
            <button aria-label="More">
              <Icon.kebab size={20} />
            </button>
          </div>
        )}

        <div className="view" ref={viewRef}>
          {(() => {
            const fwd = trans && trans.dir === "fwd" && trans.point;
            const clipping = fwd && trans.hero !== true;
            const st: React.CSSProperties = { height: "100%" };
            if (clipping) {
              const started = trans.phase !== "start";
              const cp = `circle(${started ? trans.clipR : 0}px at ${trans.point.x}px ${trans.point.y}px)`;
              (st as any).clipPath = cp;
              (st as any).WebkitClipPath = cp;
              st.transition = started ? `clip-path .6s ${EASE}` : "none";
              st.position = "relative";
              st.zIndex = 25;
            }
            return (
              <div className="t-base" key={view} style={st}>
                {renderScreen(view)}
              </div>
            );
          })()}
          {trans && (
            <React.Fragment>
              {(() => {
                const fromStyle = layerStyle(trans);
                if (trans.dir === "rev" && trans.hero === false && trans.point) {
                  const collapsed = trans.phase !== "start";
                  const cp = `circle(${collapsed ? 0 : trans.clipR}px at ${trans.point.x}px ${trans.point.y}px)`;
                  (fromStyle as any).clipPath = cp;
                  (fromStyle as any).WebkitClipPath = cp;
                  fromStyle.opacity = 1;
                  fromStyle.transition = collapsed ? `clip-path .55s ${EASE}` : "none";
                }
                return (
                  <div className="t-layer t-from" style={fromStyle}>
                    {renderScreen(trans.from)}
                  </div>
                );
              })()}
              {trans.hero !== false &&
                (() => {
                  const t = trans;
                  const geom =
                    t.dir === "fwd"
                      ? t.phase === "start"
                        ? t.origin
                        : t.target
                      : t.phase === "start"
                        ? t.target
                        : t.origin;
                  const op =
                    t.dir === "fwd" ? (t.phase === "reveal" ? 0 : 1) : t.phase === "start" ? 1 : 0;
                  const anim = t.phase !== "start";
                  return (
                    <div
                      className="grain"
                      aria-hidden
                      style={{
                        position: "absolute",
                        zIndex: 40,
                        pointerEvents: "none",
                        overflow: "hidden",
                        left: geom!.left,
                        top: geom!.top,
                        width: geom!.width,
                        height: geom!.height,
                        borderRadius: geom!.borderRadius,
                        opacity: op,
                        background: artBg(t.seed, t.grad),
                        boxShadow: "0 30px 70px -26px rgba(0,0,0,.5)",
                        transition: anim
                          ? `left .58s ${EASE}, top .58s ${EASE}, width .58s ${EASE}, height .58s ${EASE}, border-radius .58s ${EASE}, opacity .34s ease`
                          : "none",
                      }}
                    >
                      {t.image && (
                        <img
                          src={t.image}
                          alt=""
                          draggable={false}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                    </div>
                  );
                })()}
            </React.Fragment>
          )}
        </div>

        {!npView && playback.current && (
          <PlayerBar
            track={current}
            playing={playing}
            setPlaying={setPlaying}
            liked={isLiked}
            toggleLike={() => current && toggleLike(current.id)}
            accent={accent}
            shuffle={shuffle}
            setShuffle={setShuffle}
            repeat={repeat}
            onToggleRepeat={onToggleRepeat}
            onNext={playNext}
            onPrev={playPrev}
            positionSec={playback.progress.duration}
            durationSec={playback.duration.duration}
            onSeek={playback.seek}
            volume={playback.volume}
            onVolume={playback.setVolume}
            onOpenNowPlaying={() => navigate("np")}
            onOpenQueue={() => navigate("queue")}
            onOpenComments={() => navigate("comments")}
            onOpenLyrics={() => navigate("np")}
            onOpenArtist={openArtist}
          />
        )}
      </div>

      {menu && (
        <React.Suspense fallback={null}>
          <LazyContextMenu
            x={menu.x}
            y={menu.y}
            items={menu.items}
            accent={accent}
            onClose={() => setMenu(null)}
          />
        </React.Suspense>
      )}
    </div>
  );
}
