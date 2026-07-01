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

import { artBg, Equalizer } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { wailsRuntime } from "@/infra/wails";
import { RepeatMode } from "@domain/model/repeat";
import {
  useCatalog,
  useComments,
  useDailyRecommendations,
  useArtistMusicVideos,
  useLyric,
  useMusicVideoComments,
  useMusicVideoDiscovery,
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
import { useAppMenu } from "@/hooks/useAppMenu";
import { useShellNavigation } from "@/hooks/useShellNavigation";
import { ScreenActionsProvider } from "@/hooks/screenActions";
import { useQueueActions } from "@/hooks/useQueueActions";

import { PlayerBar } from "@/components/PlayerBar";
import { Button } from "@/components/controls/Button";
import { TooltipProvider } from "@/components/controls/Tooltip";
import { buildWorlds } from "@/model/navigation";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
// ContextMenu is only shown on right-click — lazy-load to keep it out of the main bundle.
const LazyContextMenu = React.lazy(() =>
  import("@/components/Menu").then((m) => ({ default: m.ContextMenu })),
);
import { ShellScreenRouter } from "@/ShellScreenRouter";
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
  const repeatOne = playback.repeat === RepeatMode.ONE;
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
  const { videos: musicVideos, isLoading: musicVideosLoading } = useMusicVideoDiscovery(
    catalog.artists,
  );
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
    musicVideoObj,
    musicVideoRelated,
    libraryTab,
    libraryView,
    searchQuery,
    setLibraryTab,
    setLibraryView,
    setSeedQuery,
    playContext,
    navigate,
    goBack,
    goHome,
    openSearch,
    openDetail,
    albumDetail,
    openChart,
    openArtist,
    openMusicVideo,
    openMusicVideoTheater,
    openLib,
    viewRef,
    trans,
    startForward,
    morph,
  } = useShellNavigation(media, queryClient);
  const npView = view === "np";
  const mvTheaterView = view === "mv-theater";
  const homeView = view === "xmb";
  const relatedMusicVideos = useArtistMusicVideos(
    musicVideoObj?.artistId,
    view === "mv-detail" || view === "mv-theater",
  );
  const musicVideoComments = useMusicVideoComments(musicVideoObj?.id, mvTheaterView);
  const musicVideoRail = relatedMusicVideos.length ? relatedMusicVideos : musicVideoRelated;

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

  const { enqueueById } = useQueueActions({
    addToQueue: playback.addToQueue,
    catalogTracks: catalog.allTracks,
    playbackTracks: playback.tracks,
    queueTracks: queue,
    playContext,
  });

  /* ---- right-click context menu (extracted hook) ---- */
  const { menu, setMenu, actions } = useContextMenu({
    onPlay,
    enqueue: enqueueById,
    openDetail,
    openArtist,
    toggleLike,
    liked,
  });
  const openAppMenu = useAppMenu({
    setMenu,
    canGoBack: !homeView,
    hasQueue: !!playback.current,
    goBack,
    goHome,
    openSearch,
    openLibrary: () => openLib("playlists"),
    openQueue: () => navigate("queue"),
    openProfile: () => navigate("profile"),
    openSettings: () => navigate("settings"),
  });

  /* ---- global keyboard shortcuts (extracted hook) ---- */
  useGlobalShortcuts({
    view,
    goBack,
    goHome,
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

  // Player bar visibility: shown when a track exists and we're not in the
  // full-screen now-playing view. Motion's AnimatePresence keeps it mounted
  // through the slide-out so it glides instead of popping.
  const showBar = !npView && !mvTheaterView && !!playback.current;

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
  const renderScreen = (screenView: string) => (
    <ShellScreenRouter
      view={screenView}
      cats={cats}
      accent={accent}
      playing={playing}
      current={current}
      hasCurrentTrack={!!playback.current}
      queue={queue}
      catalog={catalog}
      daily={daily}
      libraryData={libraryData}
      toplists={toplists}
      searchQuery={searchQuery}
      search={search}
      settings={settings}
      liked={liked}
      isLiked={isLiked}
      lyrics={lyrics}
      comments={comments}
      history={history}
      playRecord={playRecord}
      libraryTab={libraryTab}
      libraryView={libraryView}
      detail={detail}
      artistObj={artistObj}
      musicVideoObj={musicVideoObj}
      musicVideos={musicVideos}
      musicVideosLoading={musicVideosLoading}
      musicVideoRail={musicVideoRail}
      musicVideoComments={musicVideoComments}
      heroTreatment={heroTreatment}
      accentOptions={[...ACCENT_OPTIONS]}
      progressSec={playback.progress.duration}
      xmbCategory={xmbCategory}
      setXmbCategory={setXmbCategory}
      xmbRowByCategory={xmbRowByCategory}
      setXmbRowByCategory={setXmbRowByCategory}
      startForward={startForward}
      setSeedQuery={setSeedQuery}
      setLibraryTab={setLibraryTab}
      setLibraryView={setLibraryView}
      setAccent={setAccent}
      setSettings={setSettings}
      navigate={navigate}
      goBack={goBack}
      openDetail={openDetail}
      albumDetail={albumDetail}
      openChart={openChart}
      openArtist={openArtist}
      openMusicVideo={openMusicVideo}
      openMusicVideoTheater={openMusicVideoTheater}
      onPlay={onPlay}
      onPause={playback.pause}
      onNext={playNext}
      onPrev={playPrev}
      toggleLike={toggleLike}
      shufflePlay={playback.shufflePlay}
    />
  );

  // No native frame: the faux traffic lights take over real window controls; a draggable strip at the top moves the window.
  const dragStyle = { "--wails-draggable": "drag" } as React.CSSProperties;
  const noDragStyle = { "--wails-draggable": "no-drag" } as React.CSSProperties;

  return (
    <TooltipProvider delayDuration={350} skipDelayDuration={500}>
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
                    ["r", "Close", () => wailsRuntime()?.Quit?.()],
                    ["y", "Minimise", () => wailsRuntime()?.WindowMinimise?.()],
                    ["g", "Maximise", () => wailsRuntime()?.WindowToggleMaximise?.()],
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

              {!npView && !mvTheaterView && (
                <div className="win-tools" style={noDragStyle}>
                  {!homeView && (
                    <Button onClick={goBack} aria-label="Back">
                      <Icon.back size={20} />
                    </Button>
                  )}
                  <Button onClick={() => navigate("np")} aria-label="Now playing">
                    <Equalizer playing={playing} color="currentColor" size={18} />
                  </Button>
                  <Button onClick={openAppMenu} aria-label="More actions">
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
                      repeatOne={repeatOne}
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
    </TooltipProvider>
  );
}
