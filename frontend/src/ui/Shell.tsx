// ============================================================
// Sonance Vibe — Shell
// Resident shell + shared-element transition engine, ported verbatim from the
// example Sonance Vibe.html App. The phase machine (trans / startForward /
// startReverse / morph layers) is unchanged; only the example's mock playback became the real kernel.
//
// The morph engine, spatial navigation, context menu, and likes/history state
// have been extracted into dedicated hooks for clarity.
// Shell remains the composition root: it owns navigation state, data fetching
// (openDetail / openArtist), the XMB category model, and screen rendering.
// ============================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";

import "./Shell.css";

import { useMediaService } from "@/hooks/useMediaService";

import { artBg, Equalizer, Icon } from "@/components/primitives";
import { RepeatMode } from "@domain/model/repeat";
import {
  useCatalog,
  useLyric,
  useProviderSearch,
  useToplists,
  useVibePlayback,
} from "@/hooks/data";
import {
  toVibeAlbum,
  toVibeArtist,
  toVibePlaylist,
  toVibeTracks,
  type ArtistTarget,
  type DetailTarget,
  type OpenTarget,
  type ScreenData,
  type VibeCollection,
  type VibeTrack,
} from "@/model/adapt";
import { useLikes } from "@/hooks/useLikes";
import { useMorphTransition, MorphStage, MorphProvider } from "@/infra/morph";
import { useSpatialNavigation } from "@/hooks/useSpatialNavigation";
import { useContextMenu } from "@/hooks/useContextMenu";
import { ScreenActionsProvider } from "@/hooks/screenActions";

import { PlayerBar } from "@/components/PlayerBar";
import { Button } from "@/components/controls/Button";
import { XMB, type XmbCat, type XmbItemModel } from "@/screens/XMB";
import { ForYouScreen } from "@/screens/ForYou";
import { NowPlaying } from "@/screens/NowPlaying";
// ContextMenu is only shown on right-click — lazy-load to keep it out of the main bundle.
const LazyContextMenu = React.lazy(() =>
  import("@/components/Menu").then((m) => ({ default: m.ContextMenu })),
);
import { SearchScreen } from "@/screens/Search";
import { ChartsScreen } from "@/screens/Charts";
import { LibraryScreen } from "@/screens/Library";
import { PlaylistDetailScreen } from "@/screens/Detail";
import { QueueScreen } from "@/screens/Queue";
import { HistoryScreen } from "@/screens/History";
import { SettingsScreen } from "@/screens/Settings";
import { ArtistScreen } from "@/screens/Artist";
import { ProfileScreen } from "@/screens/Profile";
import { BrowseScreen } from "@/screens/Browse";
import { CommentsScreen } from "@/screens/Comments";
import {
  ACCENT_OPTIONS,
  DEFAULT_ACCENT,
  DEFAULT_GLASS_BLUR,
  PLACEHOLDER_TRACK,
} from "@/model/defaults";

// One frame of navigation state — enough to rebuild any screen on "back".
// Screen rendering reads several independent Shell state slices (detail /
// artistObj / library tab+view / search seed), so a back-stack entry must
// snapshot all of them, not just the `view` string.
type NavSnapshot = {
  view: string;
  detail: DetailTarget | null;
  artistObj: ArtistTarget;
  libraryTab: string;
  libraryView: string;
  searchQuery: string;
  playContext: VibeTrack[];
  // The morph origin tile active while on this screen — restored so a later
  // collapse-to-launcher flies from the right place after a deep back-walk.
  lastTile: unknown;
};

export default function Shell() {
  const media = useMediaService();
  const queryClient = useQueryClient();

  /* ---- theme tweaks (example TweaksPanel knobs; fixed here, accent editable in Settings) ---- */
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  // "color", never "mono": a greyscale portrait reads as a memorial photo
  // (遗照) in Chinese culture — never desaturate a living artist's photo.
  const [heroTreatment] = useState<"mono" | "color">("color");
  const [glass] = useState(DEFAULT_GLASS_BLUR);
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--glass-blur", glass + "px");
  }, [accent, glass]);

  /* ---- navigation / view state (kept as-is) ---- */
  const [view, setView] = useState("xmb");
  const [xmbCategory, setXmbCategory] = useState(1);
  const [xmbRowByCategory, setXmbRowByCategory] = useState<Record<string, number>>({});
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [artistObj, setArtistObj] = useState<ArtistTarget>({ id: "", name: "" });
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

  /* ---- real kernel playback state (replaces the example's mock + local useState) ---- */
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

  // Remember the current screen before a forward hop. No-op at the launcher:
  // the XMB↔screen boundary is the morph engine's (startReverse), not the stack's.
  // Reads navSnapRef at call time (populated each render, after the morph hook).
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
  // Open Search from anywhere (XMB entry + the global "/" hotkey). pushCurrent is a
  // no-op at the launcher, so this is safe both from the XMB and from a screen.
  const openSearch = useCallback(() => {
    setSeedQuery("");
    navigate("search");
  }, [navigate]);

  /* ---- catalog / charts / search (real provider) ---- */
  const { catalog } = useCatalog();
  const toplists = useToplists();
  const search = useProviderSearch();
  // Screens read provider data only; when the provider returns nothing they show
  // their own empty states. For populated data in dev, run with VITE_PROVIDER=mock.
  const screenData = useMemo<ScreenData>(
    () => ({
      playlists: catalog.playlists,
      albums: catalog.albums,
      artists: catalog.artists,
      allTracks: catalog.allTracks,
    }),
    [catalog],
  );

  /* ---- likes / settings / history (extracted hook) ---- */
  const { liked, toggleLike, isLiked, history, settings, setSettings } = useLikes(playback.current);

  // Current-track lyrics, kernel-owned (Lyric plugin follows the track); the UI
  // just reads them. [] when none — NowPlaying shows "No lyrics" on its own.
  const lyrics = useLyric();

  /* ---- open detail: fetch the real collection async (switch screen + skeleton now, backfill tracks when data lands) ---- */
  const openDetail = useCallback(
    (input: OpenTarget) => {
      pushCurrent();
      // Detail screens assume tracks is always an array (they read p.tracks.length);
      // a summary (charts especially) may lack it, so default it.
      const obj: DetailTarget = { ...input, tracks: input.tracks ?? [] };
      setDetail(obj);
      playContext.current = obj.tracks;
      setView("detail");
      // Real playlist/collection summaries carry no tracks -> fetch detail to backfill.
      if (obj.id && obj._real !== false && obj.tracks.length === 0) {
        const kind = obj.kind;
        const fetcher =
          kind === "Album"
            ? () => media.albumDetail(obj.id).then(toVibeAlbum)
            : kind === "Chart"
              ? () => media.toplistDetail(obj.id).then(toVibePlaylist)
              : () => media.playlistDetail(obj.id).then(toVibePlaylist);
        queryClient
          .fetchQuery({ queryKey: ["detail", kind, media.providerName, obj.id], queryFn: fetcher })
          .then((full) => {
            // detail wins by default; keep the summary's identity fields when the
            // detail lacks them (charts especially).
            const merged: DetailTarget = {
              ...obj,
              ...full,
              name: full.name || obj.name,
              image: full.image || obj.image,
              coverSeed: obj.coverSeed ?? full.coverSeed,
              kind: obj.kind ?? full.kind,
              tracks: full.tracks?.length ? full.tracks : obj.tracks,
            };
            playContext.current = merged.tracks;
            setDetail(merged);
          })
          .catch(() => {});
      }
    },
    [media, queryClient, pushCurrent],
  );
  const albumDetail = useCallback(
    (al: VibeCollection) => openDetail({ ...al, kind: "Album" }),
    [openDetail],
  );
  const openChart = useCallback(
    (c: VibeCollection) => openDetail({ ...c, kind: "Chart", _real: true }),
    [openDetail],
  );
  const openArtist = useCallback(
    (ar: ArtistTarget) => {
      pushCurrent();
      setArtistObj(ar);
      playContext.current = ar.tracks ?? [];
      setView("artist");
      if (ar.id && (!ar.tracks || ar.tracks.length === 0)) {
        queryClient
          .fetchQuery({
            queryKey: ["artist", media.providerName, ar.id],
            queryFn: () => media.artistDetail(ar.id),
          })
          .then((full) => {
            const mapped: ArtistTarget = {
              ...toVibeArtist(full),
              tracks: toVibeTracks(full.topTracks),
            };
            playContext.current = mapped.tracks ?? [];
            setArtistObj(mapped);
          })
          .catch(() => {});
      }
    },
    [media, queryClient, pushCurrent],
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
        id: "liked",
        name: "Liked Songs",
        kind: "Playlist",
        owner: "You",
        coverSeed: 0,
        gradient: ["#2a0420", "#ff4fa3"],
        _real: false,
        description: "Everything you've hearted, in one place.",
        tracks: screenData.allTracks.filter((t) => liked.has(t.id)),
      }),
    [openDetail, screenData, liked],
  );

  /* ---- right-click context menu (extracted hook) ---- */
  const { menu, setMenu, actions } = useContextMenu({
    onPlay,
    openDetail,
    openArtist,
    toggleLike,
    liked,
  });

  /* ---- page-to-page transition engine (UI-layer infra: @/infra/morph) ---- */
  const viewRef = useRef<HTMLDivElement | null>(null);
  const { trans, startForward, startReverse, lastTile, morph } = useMorphTransition(
    viewRef,
    view,
    setView,
  );

  /* Mirror the live navigation state so a back-stack push captures the screen
     being left without stale closures. Written during render (pure mirror);
     placed after the morph hook so lastTile is in scope. A card morph mutates
     lastTile only inside the click handler that follows this render, so the
     value captured here is still the origin tile of the *current* screen. */
  navSnapRef.current = {
    view,
    detail,
    artistObj,
    libraryTab,
    libraryView,
    searchQuery,
    playContext: playContext.current,
    lastTile: lastTile.current,
  };

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
    lastTile.current = prev.lastTile;
  }, [startReverse, lastTile]);

  /* Global keys: Esc backs out one level (shares the back-stack, not always to the
     launcher); "/" or ⌘/Ctrl+K opens Search from anywhere — unless typing in a field. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && view !== "xmb") {
        goBack();
        return;
      }
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
        return;
      }
      const slash = e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey;
      const cmdK = (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey);
      if ((slash || cmdK) && view !== "search") {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, goBack, openSearch]);

  /* ---- arrow-key spatial navigation (extracted hook) ---- */
  useSpatialNavigation(viewRef, view, goBack);

  const npView = view === "np";
  const homeView = view === "xmb";

  // Player bar visibility: shown when a track exists and we're not in the
  // full-screen now-playing view. Motion's AnimatePresence keeps it mounted
  // through the slide-out so it glides instead of popping.
  const showBar = !npView && !!playback.current;

  /* ==========================================================================
     XMB model -- built from the real catalog + static categories (mirrors the example domain partitions)
     ========================================================================== */
  const cats = useMemo<XmbCat[]>(() => {
    const pls = screenData.playlists;
    const als = screenData.albums;
    const ars = screenData.artists;

    // 2 · DISCOVER — Catalog (find music). Provider-capability gated, authored in
    // priority order (most-likely-wanted first). Browse-by-facet has no provider
    // capability yet, so it is reserved (priority #2) but omitted until one exists.
    const discover: XmbItemModel[] = [];
    if (media.supports("personalized")) {
      discover.push({
        key: "foryou",
        label: "For You",
        sub: "Your daily landing",
        icon: "star",
        seed: 7,
        grad: ["#1b1033", "#ff2188"],
        dest: "home",
        run: () => setView("home"),
      });
    }
    if (media.supports("toplist")) {
      discover.push({
        key: "charts",
        label: "Charts",
        sub: "Ranked by plays",
        icon: "bars",
        seed: 10,
        grad: ["#240b04", "#ff8a3c"],
        dest: "charts",
        run: () => setView("charts"),
      });
    }
    if (media.supports("search")) {
      discover.push({
        key: "search",
        label: "Search",
        sub: "Tracks, artists, albums",
        icon: "search",
        seed: 6,
        grad: ["#021e24", "#36c5e0"],
        dest: "search",
        run: openSearch,
      });
    }

    // A capability-aware priority tree: L1 = bounded-context "worlds"; L2 = that
    // world's entries in priority order. Now Playing / Library / You / Settings are
    // local (always present); only Discover is provider-gated. Empty worlds drop out.
    const worlds: XmbCat[] = [
      // 1 · NOW PLAYING — the live session: present (Player) · future (Up Next) · past (History).
      {
        id: "np",
        icon: "play",
        label: "Now Playing",
        items: [
          {
            key: "player",
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
            key: "queue",
            label: "Up Next",
            sub: queue.length + " tracks queued",
            icon: "list",
            seed: 5,
            dest: "queue",
            run: () => setView("queue"),
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
      // 2 · DISCOVER — Catalog (find music), provider-gated (built above).
      {
        id: "discover",
        icon: "compass",
        label: "Discover",
        items: discover,
      },
      // 3 · LIBRARY — the user's own world (local, never gated).
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
            label: "Playlists",
            sub: pls.length + " playlists",
            icon: "list",
            seed: 1,
            grad: ["#1a0d3a", "#7755ff"],
            dest: "library",
            run: () => openLib("playlists"),
          },
          {
            key: "albums",
            label: "Albums",
            sub: als.length + " albums",
            icon: "stack",
            seed: 2,
            grad: ["#3a0d10", "#f3727f"],
            dest: "library",
            run: () => openLib("albums"),
          },
          {
            key: "artists",
            label: "Artists",
            sub: ars.length + " following",
            icon: "user",
            seed: 4,
            grad: ["#06222b", "#19d3c5"],
            dest: "library",
            run: () => openLib("artists"),
          },
        ],
      },
      // 4 · YOU — identity / taste (local).
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
      // 5 · SETTINGS — the tool (local).
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
            icon: "note",
            seed: 2,
            dest: "settings",
            run: () => setView("settings"),
          },
        ],
      },
    ];

    // Never show an empty world (e.g. Discover when the provider supports none of its entries).
    return worlds.filter((w) => w.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cats curates deps; the referenced callbacks (openSearch, likedDetail, openLib) are memoized and stable, so they aren't listed.
  }, [current, queue, liked, screenData, media]);

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
          np={
            playback.current
              ? {
                  image: current.image,
                  seed: current.coverSeed,
                  grad: current.gradient,
                }
              : undefined
          }
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
          onPlay={onPlay}
          current={current}
          playing={playing}
          accent={accent}
          query={searchQuery}
          onQuery={setSeedQuery}
          liked={liked}
          toggleLike={toggleLike}
          openArtist={openArtist}
          openAlbum={albumDetail}
          search={search}
        />
      );
    if (v === "charts") return <ChartsScreen data={{ charts: toplists }} onOpenChart={openChart} />;
    if (v === "library" || v === "made")
      return (
        <LibraryScreen
          tab={libraryTab}
          view={libraryView}
          onTab={setLibraryTab}
          onView={setLibraryView}
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
          accentOptions={[...ACCENT_OPTIONS]}
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
          similar={screenData.artists.filter((a) => a.id !== artistObj?.id)}
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
          mono={heroTreatment === "mono"}
        />
      );
    if (v === "browse") return <BrowseScreen />;
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
    <MorphProvider morph={morph}>
      <ScreenActionsProvider actions={actions}>
        <div className="win-stage">
          <div className="win">
            {/* top drag strip (spans the top; traffic-light and tool buttons above it stay clickable) */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 z-[55] h-[30px]"
              style={dragStyle}
            />

            <div className="traffic" style={noDragStyle}>
              {(
                [
                  ["r", "Close", () => wails()?.Quit?.()],
                  ["y", "Minimise", () => wails()?.WindowMinimise?.()],
                  ["g", "Maximise", () => wails()?.WindowToggleMaximise?.()],
                ] as const
              ).map(([cls, label, action]) => (
                <Button
                  key={cls}
                  aria-label={label}
                  className={cls}
                  onClick={action}
                  title={label}
                />
              ))}
            </div>

            {!npView && (
              <div className="win-tools" style={noDragStyle}>
                {!homeView && (
                  <Button onClick={goBack} aria-label="Menu">
                    <Icon.back size={20} />
                  </Button>
                )}
                <Button onClick={() => navigate("np")} aria-label="Now playing">
                  <Equalizer playing={playing} color="currentColor" size={18} />
                </Button>
                <Button aria-label="More">
                  <Icon.kebab size={20} />
                </Button>
              </div>
            )}

            <MorphStage
              viewRef={viewRef}
              view={view}
              trans={trans}
              renderScreen={renderScreen}
              tileBg={artBg}
            />

            {/* Layout reservation: a flex spacer that tracks showBar *instantly* (no
            transition). Entering now-playing collapses it to 0 the same frame, so
            .view is full-height when the np cover morph measures its (vertically
            centered) hero — never re-jumping. The bar itself is positioned
            absolutely and slides independently of this spacer, so its
            appear/disappear never reflows .view. That's the fix for the asymmetry:
            with the old single collapsing box, entering np yanked the bar into a
            0-height box (no slide — a dark strip just popped where it sat); now the
            light bar visibly slides off the bottom over the full-height np content. */}
            <div aria-hidden style={{ flex: `0 0 ${showBar ? 84 : 0}px` }} />

            {/* Absolute over .win's bottom; AnimatePresence keeps it mounted through
            the slide-out. z-index 30 sits below the morph grain (40) so the flying
            cover passes over it, above .view content. overflow:visible is harmless
            now the volume popup portals out; .win (overflow:hidden) clips the slide. */}
            <AnimatePresence>
              {showBar && (
                <motion.div
                  initial={{ y: "108%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "108%", opacity: 0 }}
                  transition={{
                    y: { duration: 0.44, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.3 },
                  }}
                  className="absolute inset-x-0 bottom-0 z-30 overflow-visible will-change-transform"
                >
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
                </motion.div>
              )}
            </AnimatePresence>
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
      </ScreenActionsProvider>
    </MorphProvider>
  );
}
