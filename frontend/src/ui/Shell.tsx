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
import React, { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import "./Shell.css";

import { useMediaService } from "@/hooks/useMediaService";

import { artBg } from "@/components/primitives";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useLikes } from "@/hooks/useLikes";
import { usePlayHistory } from "@/hooks/usePlayHistory";
import { MorphStage, MorphProvider } from "@/infra/morph";
import { useSpatialNavigation } from "@/hooks/useSpatialNavigation";
import { useAppMenu } from "@/hooks/useAppMenu";
import { useShellNavigation } from "@/hooks/useShellNavigation";
import { ScreenActionsProvider } from "@/hooks/screenActions";

import { TooltipProvider } from "@/components/controls/Tooltip";
import { ShellPlayerDock } from "@/components/shell/ShellPlayerDock";
import { ShellWindowChrome } from "@/components/shell/ShellWindowChrome";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { useShellLibraryData } from "@/hooks/useShellLibraryData";
import { useShellPlayback } from "@/hooks/useShellPlayback";
import { useShellTrackActions } from "@/hooks/useShellTrackActions";
import { useShellScreenContent } from "@/hooks/useShellScreenContent";
import { useShellXmbModel } from "@/hooks/useShellXmbModel";
// ContextMenu is only shown on right-click — lazy-load to keep it out of the main bundle.
const LazyContextMenu = React.lazy(() =>
  import("@/components/Menu").then((m) => ({ default: m.ContextMenu })),
);
import { ShellScreenRouter, warmDeferredScreens } from "@/ShellScreenRouter";
import { LAUNCHER_VIEW, type ShellScreenView } from "@/model/shell-screen";
import type { NowPlayingMode } from "@/model/now-playing";

export default function Shell() {
  const media = useMediaService();
  const queryClient = useQueryClient();

  // Pull the code-split screens in once the app has settled, so the split costs
  // nothing at first navigation while still keeping them off the startup path.
  useEffect(warmDeferredScreens, []);

  /* ---- XMB launcher cursor (highlighted column/row): transient screen state
     Shell holds so it survives the XMB's mount/unmount; not part of the
     navigation back-stack (which the nav hook owns). ---- */
  const [xmbCategory, setXmbCategory] = useState(1);
  const [xmbRowByCategory, setXmbRowByCategory] = useState<Record<string, number>>({});
  const [nowPlayingInitialMode, setNowPlayingInitialMode] = useState<NowPlayingMode>("cover");

  const {
    playback,
    playFn,
    current,
    playing,
    shuffle,
    repeat,
    repeatOne,
    queue,
    togglePlay,
    toggleShuffle,
    toggleRepeat,
    playNext,
    playPrev,
  } = useShellPlayback();

  const {
    catalog,
    toplists,
    search,
    musicVideos,
    musicVideosLoading,
    loggedIn,
    userPlaylists,
    libraryData,
    playRecord,
    daily,
  } = useShellLibraryData();

  /* ---- likes / preferences / history ---- */
  const { liked, toggleLike, isLiked } = useLikes(playback.current);
  const { settings, setSettings } = useAppSettings();
  const history = usePlayHistory(playback.current);
  const settingsNowPlayingMode: NowPlayingMode = settings.npMode === "LYRICS" ? "lyrics" : "cover";
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
  /* ---- navigation intents handed to memoized children (the dock, the XMB
     tree, the window chrome). Stable identities on purpose: an inline arrow
     here re-runs buildWorlds on every Shell render and defeats React.memo on
     PlayerBar / XMB, which is most of what the memo was there to prevent. ---- */
  const openNowPlaying = useCallback(
    (mode: NowPlayingMode) => {
      setNowPlayingInitialMode(mode);
      navigate("np");
    },
    [navigate],
  );
  const openNowPlayingCover = useCallback(() => openNowPlaying("cover"), [openNowPlaying]);
  const openNowPlayingLyrics = useCallback(() => openNowPlaying("lyrics"), [openNowPlaying]);
  const gotoLauncherView = useCallback(
    (target: ShellScreenView) => {
      if (target === "np") setNowPlayingInitialMode(settingsNowPlayingMode);
      setView(target);
    },
    [settingsNowPlayingMode, setView],
  );
  const openStage = useCallback(() => navigate("stage"), [navigate]);
  const openQueue = useCallback(() => navigate("queue"), [navigate]);
  const openComments = useCallback(() => navigate("comments"), [navigate]);
  const openProfile = useCallback(() => navigate("profile"), [navigate]);
  const openSettings = useCallback(() => navigate("settings"), [navigate]);
  const openLibraryPlaylists = useCallback(() => openLib("playlists"), [openLib]);
  const npView = view === "np";
  const mvTheaterView = view === "mv-theater";
  const stageView = view === "stage";
  const homeView = view === LAUNCHER_VIEW;
  const { lyrics, comments, musicVideoRail, musicVideoComments } = useShellScreenContent({
    view,
    currentTrackId: playback.current?.id,
    musicVideoArtistId: musicVideoObj?.artistId,
    musicVideoId: musicVideoObj?.id,
    musicVideoRelated,
  });

  const { onPlay, likedDetail, menu, setMenu, actions } = useShellTrackActions({
    play: playFn,
    addToQueue: playback.addToQueue,
    addNextToQueue: playback.addNextToQueue,
    catalog,
    playbackTracks: playback.tracks,
    queue,
    playContext,
    loggedIn,
    userPlaylists,
    liked,
    openDetail,
    openArtist,
    toggleLike,
  });
  const openAppMenu = useAppMenu({
    setMenu,
    canGoBack: !homeView,
    hasQueue: !!playback.current,
    goBack,
    goHome,
    openSearch,
    openLibrary: openLibraryPlaylists,
    openQueue,
    openProfile,
    openSettings,
  });
  // The dock's like button acts on whatever is playing; keeping it out of the
  // JSX means the memoized PlayerBar only sees a new handler when the track does.
  const toggleCurrentLike = useCallback(() => {
    if (current) toggleLike(current);
  }, [current, toggleLike]);

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
    currentTrack: playback.current,
    hasCurrentTrack: !!playback.current,
    toggleLike,
  });

  /* ---- arrow-key spatial navigation (extracted hook) ---- */
  useSpatialNavigation(viewRef, view, goBack);

  // Player bar visibility: shown when a track exists and we're not in the
  // full-screen now-playing view. Motion's AnimatePresence keeps it mounted
  // through the slide-out so it glides instead of popping.
  const showBar = !npView && !mvTheaterView && !stageView && !!playback.current;

  /* ==========================================================================
     XMB model — the navigation IA tree, projected from catalog + provider
     capabilities + session state (see @/model/navigation, docs §11).
     ========================================================================== */
  const cats = useShellXmbModel({
    media,
    catalog,
    liked,
    current: playback.current ?? undefined,
    queueLength: queue.length,
    goto: gotoLauncherView,
    openSearch,
    openLibrary: openLib,
    openLikedSongs: likedDetail,
  });

  /* ==========================================================================
     render screen
     ========================================================================== */
  const renderScreen = (screenView: ShellScreenView) => (
    <ShellScreenRouter
      view={screenView}
      playback={{
        playing,
        current,
        hasCurrentTrack: !!playback.current,
        queue,
        onPlay,
        onPause: playback.pause,
        onNext: playNext,
        onPrev: playPrev,
        selectTrack: playback.selectTrack,
        removeFromQueue: playback.removeFromQueue,
        clearQueue: playback.clearQueue,
        shufflePlay: playback.shufflePlay,
      }}
      navigation={{
        goBack,
        startForward,
        openDetail,
        albumDetail,
        openChart,
        openArtist,
        openLibrary: openLib,
        openMusicVideo,
        openMusicVideoTheater,
        openStage,
        cats,
        xmbCategory,
        setXmbCategory,
        xmbRowByCategory,
        setXmbRowByCategory,
      }}
      catalog={{
        catalog,
        toplists,
        daily,
        searchQuery,
        search,
        setSeedQuery,
      }}
      library={{
        libraryData,
        libraryTab,
        libraryView,
        setLibraryTab,
        setLibraryView,
        liked,
        isLiked,
        toggleLike,
        history,
        playRecord,
      }}
      content={{
        lyrics,
        comments,
        detail,
        artistObj,
      }}
      musicVideo={{
        musicVideoObj,
        musicVideos,
        musicVideosLoading,
        musicVideoRail,
        musicVideoComments,
        playbackPolicy: media.musicVideoPlaybackPolicy(),
      }}
      settings={{
        settings,
        setSettings,
        nowPlayingInitialMode,
      }}
    />
  );

  return (
    <TooltipProvider delay={350} timeout={500}>
      <MorphProvider morph={morph}>
        <ScreenActionsProvider actions={actions}>
          <div className="win-stage">
            <div className="win">
              <ShellWindowChrome
                showTools={!npView && !mvTheaterView && !stageView}
                showBack={!homeView}
                playing={playing}
                canOpenNowPlaying={!!playback.current}
                onBack={goBack}
                onNowPlaying={openNowPlayingCover}
                onMenu={openAppMenu}
              />

              <MorphStage
                viewRef={viewRef}
                view={view}
                trans={trans}
                renderScreen={renderScreen}
                tileBg={artBg}
              />

              <ShellPlayerDock
                show={showBar}
                track={current}
                playing={playing}
                onTogglePlay={togglePlay}
                liked={isLiked}
                toggleLike={toggleCurrentLike}
                shuffle={shuffle}
                onToggleShuffle={toggleShuffle}
                repeat={repeat}
                repeatOne={repeatOne}
                onToggleRepeat={toggleRepeat}
                onNext={playNext}
                onPrev={playPrev}
                onSeek={playback.seek}
                volume={playback.volume}
                onVolume={playback.setVolume}
                onToggleMute={playback.toggleMute}
                onOpenNowPlaying={openNowPlayingCover}
                onOpenStage={openStage}
                onOpenQueue={openQueue}
                onOpenComments={openComments}
                onOpenLyrics={openNowPlayingLyrics}
                onOpenArtist={openArtist}
              />
            </div>

            {menu && (
              <React.Suspense fallback={null}>
                <LazyContextMenu
                  x={menu.x}
                  y={menu.y}
                  items={menu.items}
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
