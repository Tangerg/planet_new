// ============================================================
// Sonance Vibe — Shell
// Resident shell, ported verbatim from the example Sonance Vibe.html App; only
// the example's mock playback became the real kernel.
//
// Shell is the composition root: it wires the kernel playback state, catalog
// data, likes, and the navigation machine (useShellNavigation — view state,
// morph engine, back-stack), then renders the active screen, the player bar,
// and the window chrome. The heavy lifting lives in dedicated hooks/modules:
//   - useShellNavigation  navigation state machine + shared-element morph
//   - useGlobalShortcuts   discrete app-wide keyboard shortcuts
//   - useSpatialNavigation arrow-key spatial nav
//   - useContextMenu       right-click menu
//   - buildWorlds          the XMB navigation IA tree (@/model/navigation)
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";

import "./Shell.css";

import { useMediaService } from "@/hooks/useMediaService";

import { artBg, Equalizer, Icon } from "@/components/primitives";
import { RepeatMode } from "@domain/model/repeat";
import {
  useCatalog,
  useComments,
  useDailyRecommendations,
  useLyric,
  usePlayRecord,
  useProviderSearch,
  useToplists,
  useUserPlaylists,
  useVibePlayback,
} from "@/hooks/data";
import { useAuthStore } from "@/store/auth";
import { type VibeTrack } from "@/model/adapt";
import { useLikes } from "@/hooks/useLikes";
import { MorphStage, MorphProvider } from "@/infra/morph";
import { useSpatialNavigation } from "@/hooks/useSpatialNavigation";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useShellNavigation } from "@/hooks/useShellNavigation";
import { ScreenActionsProvider } from "@/hooks/screenActions";

import { PlayerBar } from "@/components/PlayerBar";
import { Button } from "@/components/controls/Button";
import { XMB } from "@/screens/XMB";
import { buildWorlds } from "@/model/navigation";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
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
import { CommentsScreen } from "@/screens/Comments";
import {
  ACCENT_OPTIONS,
  DEFAULT_ACCENT,
  DEFAULT_GLASS_BLUR,
  PLACEHOLDER_TRACK,
} from "@/model/defaults";

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

  /* ---- XMB launcher cursor (highlighted column/row): transient screen state
     Shell holds so it survives the XMB's mount/unmount; not part of the
     navigation back-stack (which the nav hook owns). ---- */
  const [xmbCategory, setXmbCategory] = useState(1);
  const [xmbRowByCategory, setXmbRowByCategory] = useState<Record<string, number>>({});

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

  /* ---- catalog / charts / search (real provider) ---- */
  const { catalog } = useCatalog();
  const toplists = useToplists();
  const search = useProviderSearch();
  // The logged-in user's own playlists (empty when anonymous) — feed the Library
  // Playlists tab + the real "liked songs" view.
  const loggedIn = useAuthStore((s) => s.loggedIn);
  const userPlaylists = useUserPlaylists();
  // Library's Playlists tab shows the user's own playlists when logged in,
  // falling back to the personalized catalog when anonymous.
  const libraryData = useMemo(
    () => (loggedIn && userPlaylists.length ? { ...catalog, playlists: userPlaylists } : catalog),
    [loggedIn, userPlaylists, catalog],
  );

  /* ---- likes / settings / history (extracted hook) ---- */
  const { liked, toggleLike, isLiked, history, settings, setSettings } = useLikes(playback.current);
  // Real account play record (most played last week / all time); empty when
  // anonymous, so the History screen falls back to this session's plays only.
  const playRecord = usePlayRecord();
  // The day's recommendations ("每日推荐"); empty when anonymous, so ForYou's hero
  // falls back to a catalog playlist.
  const daily = useDailyRecommendations();

  // Current-track lyrics, kernel-owned (Lyric plugin follows the track); the UI
  // just reads them. [] when none — NowPlaying shows "No lyrics" on its own.
  const lyrics = useLyric();

  /* ---- navigation + shared-element transition machine (extracted hook) ----
     Owns the view string, every nav-significant screen slice, the morph engine,
     and the back-stack. Shell composes onPlay / likedDetail / menu / shortcuts /
     the XMB tree on top of what it returns. */
  const {
    view,
    setView,
    detail,
    artistObj,
    libraryTab,
    libraryView,
    searchQuery,
    setLibraryTab,
    setLibraryView,
    setSeedQuery,
    playContext,
    navigate,
    goBack,
    openSearch,
    openDetail,
    albumDetail,
    openChart,
    openArtist,
    openLib,
    viewRef,
    trans,
    startForward,
    morph,
  } = useShellNavigation(media, queryClient);

  // Current-track comments (NCM hot/recent). Fetched only while a comments
  // surface is on screen (the standalone Comments view or Now Playing's comments
  // mode), gated by the provider capability — never for every track played.
  const comments = useComments(playback.current?.id, view === "comments" || view === "np");

  /* Play a track within the current browse context (the open collection); a
     track not in that list (e.g. a lone search result) plays on its own. */
  const onPlay = useCallback(
    (track: VibeTrack | undefined) => {
      if (!track) return;
      const ctx = playContext.current;
      const list = ctx?.length && ctx.some((t) => t.id === track.id) ? ctx : [track];
      playFn(list, track);
    },
    [playFn, playContext],
  );

  // "Liked Songs" is a synthetic playlist projected from the like set; it routes
  // through openDetail like any collection (but never fetches — _real: false).
  const likedDetail = useCallback(() => {
    // Logged in: open the real "liked songs" playlist (NCM puts it first) so it
    // shows the full account list, not just the catalog matches.
    const real = loggedIn ? userPlaylists[0] : undefined;
    if (real) {
      openDetail({ ...real, kind: "Playlist" });
      return;
    }
    openDetail({
      id: "liked",
      name: "Liked Songs",
      kind: "Playlist",
      owner: "You",
      coverSeed: 0,
      gradient: ["#2a0420", "#ff4fa3"],
      _real: false,
      description: "Everything you've hearted, in one place.",
      tracks: catalog.allTracks.filter((t) => liked.has(t.id)),
    });
  }, [openDetail, loggedIn, userPlaylists, catalog, liked]);

  /* ---- right-click context menu (extracted hook) ---- */
  const { menu, setMenu, actions } = useContextMenu({
    onPlay,
    openDetail,
    openArtist,
    toggleLike,
    liked,
  });

  /* ---- global keyboard shortcuts (extracted hook) ---- */
  useGlobalShortcuts({
    view,
    goBack,
    openSearch,
    navigate,
    togglePlay,
    playNext,
    playPrev,
    volume: playback.volume,
    setVolume: playback.setVolume,
    currentId: playback.current?.id,
    toggleLike,
  });

  /* ---- arrow-key spatial navigation (extracted hook) ---- */
  useSpatialNavigation(viewRef, view, goBack);

  const npView = view === "np";
  const homeView = view === "xmb";

  // Player bar visibility: shown when a track exists and we're not in the
  // full-screen now-playing view. Motion's AnimatePresence keeps it mounted
  // through the slide-out so it glides instead of popping.
  const showBar = !npView && !!playback.current;

  /* ==========================================================================
     XMB model — the navigation IA tree, projected from catalog + provider
     capabilities + session state (see @/model/navigation, docs §11).
     ========================================================================== */
  const cats = useMemo(
    () =>
      buildWorlds(
        {
          catalog,
          supports: (cap) => media.supports(cap),
          liked,
          current,
          queueLength: queue.length,
        },
        {
          goto: setView,
          openSearch,
          openLibrary: openLib,
          openLikedSongs: likedDetail,
        },
      ),
    [catalog, media, liked, current, queue, setView, openSearch, openLib, likedDetail],
  );

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
          data={catalog}
          daily={daily}
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
    if (v === "library")
      return (
        <LibraryScreen
          tab={libraryTab}
          view={libraryView}
          onTab={setLibraryTab}
          onView={setLibraryView}
          data={libraryData}
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
          session={history}
          week={playRecord.week}
          all={playRecord.all}
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
          albums={artistObj?.albums ?? []}
          similar={artistObj?.similar ?? []}
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
          playlists={libraryData.playlists}
          onOpenPlaylist={openDetail}
          mono={heroTreatment === "mono"}
        />
      );
    if (v === "comments")
      return (
        <CommentsScreen
          track={current}
          comments={comments}
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
          comments={comments}
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
