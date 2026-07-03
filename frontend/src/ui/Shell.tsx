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
import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import "./Shell.css";

import { useMediaService } from "@/hooks/useMediaService";

import { artBg } from "@/components/primitives";
import { useLikes } from "@/hooks/useLikes";
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
import { ShellScreenRouter } from "@/ShellScreenRouter";
import { ACCENT_OPTIONS, DEFAULT_ACCENT, DEFAULT_GLASS_BLUR } from "@/model/defaults";

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
    setPlaying,
    setShuffle,
    onToggleRepeat,
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

  /* ---- likes / settings / history (extracted hook) ---- */
  const { liked, toggleLike, isLiked, history, settings, setSettings } = useLikes(playback.current);
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
  const cats = useShellXmbModel({
    media,
    catalog,
    liked,
    current,
    queueLength: queue.length,
    goto: setView,
    openSearch,
    openLibrary: openLib,
    openLikedSongs: likedDetail,
  });

  /* ==========================================================================
     render screen
     ========================================================================== */
  const renderScreen = (screenView: string) => (
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
        shufflePlay: playback.shufflePlay,
      }}
      navigation={{
        navigate,
        goBack,
        startForward,
        openDetail,
        albumDetail,
        openChart,
        openArtist,
        openMusicVideo,
        openMusicVideoTheater,
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
        accent,
        setAccent,
        accentOptions: [...ACCENT_OPTIONS],
        heroTreatment,
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
                showTools={!npView && !mvTheaterView}
                showBack={!homeView}
                playing={playing}
                onBack={goBack}
                onNowPlaying={() => navigate("np")}
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
                onSeek={playback.seek}
                volume={playback.volume}
                onVolume={playback.setVolume}
                onOpenNowPlaying={() => navigate("np")}
                onOpenQueue={() => navigate("queue")}
                onOpenComments={() => navigate("comments")}
                onOpenLyrics={() => navigate("np")}
                onOpenArtist={openArtist}
              />
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
