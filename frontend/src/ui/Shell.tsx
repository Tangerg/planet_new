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
import { ShellScreenRouter, warmDeferredScreens } from "@/ShellScreenRouter";
import { LAUNCHER_VIEW, type ShellScreenView } from "@/model/shell-screen";
import type { NowPlayingMode } from "@/model/now-playing";
import type { XmbRowMemory } from "@/model/navigation";

const LazyContextMenu = React.lazy(() =>
  import("@/components/Menu").then((m) => ({ default: m.ContextMenu })),
);

export default function Shell() {
  const media = useMediaService();
  const queryClient = useQueryClient();

  useEffect(warmDeferredScreens, []);

  const [xmbCategory, setXmbCategory] = useState(1);
  const [xmbRowByCategory, setXmbRowByCategory] = useState<XmbRowMemory>({});
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

  const { liked, toggleLike, isLiked } = useLikes(playback.current);
  const { settings, setSettings } = useAppSettings();
  const history = usePlayHistory(playback.current);
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
      if (target === "np") setNowPlayingInitialMode(settings.npMode);
      setView(target);
    },
    [settings.npMode, setView],
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
  const toggleCurrentLike = useCallback(() => {
    if (current) toggleLike(current);
  }, [current, toggleLike]);

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

  useSpatialNavigation(viewRef, view, goBack);

  const showBar = !npView && !mvTheaterView && !stageView && !!playback.current;

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
