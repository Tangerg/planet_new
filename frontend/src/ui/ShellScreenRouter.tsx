import type React from "react";

import type {
  ArtistTarget,
  CollectionViewMode,
  DetailTarget,
  LibrarySectionTab,
  ScreenData,
  SearchResults,
  VibeCollection,
  VibeComment,
  VibeMusicVideo,
  VibeTrack,
} from "@/model/vibe";
import type { Lyric } from "@contexts/playback";
import type { MusicVideoAvailabilityPolicy } from "@contexts/catalog";
import type { XmbCat, XmbItemModel } from "@/model/navigation";
import type { Settings } from "@/model/defaults";
import { XMB } from "@/screens/XMB";
import { ForYouScreen } from "@/screens/ForYou";
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
import { NowPlaying } from "@/screens/NowPlaying";
import { Stage } from "@/screens/Stage";
import { MusicVideosScreen } from "@/screens/music-videos/MusicVideosScreen";
import { MusicVideoDetailScreen } from "@/screens/music-videos/MusicVideoDetailScreen";
import { MusicVideoTheaterScreen } from "@/screens/music-videos/MusicVideoTheaterScreen";
import type { NowPlayingMode } from "@/model/now-playing";
import { resolveShellScreen } from "@/model/shell-screen";

// Screen props grouped by bounded context so the router is a screen *assembler*,
// not a 50-field forwarder. Field names mirror the values each screen consumes;
// the router just destructures each bundle and hands screens what they need.

type PlaybackBundle = {
  playing: boolean;
  current: VibeTrack;
  hasCurrentTrack: boolean;
  queue: VibeTrack[];
  onPlay: (track: VibeTrack | undefined) => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  selectTrack: (track: VibeTrack) => void;
  removeFromQueue: (track: VibeTrack) => void;
  clearQueue: () => void;
  shufflePlay: (tracks: VibeTrack[]) => void;
};

type NavigationBundle = {
  goBack: () => void;
  startForward: (item: XmbItemModel, rect: DOMRect) => void;
  openDetail: (target: VibeCollection) => void;
  albumDetail: (target: VibeCollection) => void;
  openChart: (target: VibeCollection) => void;
  openArtist: (target: ArtistTarget) => void;
  openLibrary: (tab: LibrarySectionTab, view?: CollectionViewMode) => void;
  openMusicVideo: (video: VibeMusicVideo) => void;
  openMusicVideoTheater: (video: VibeMusicVideo) => void;
  openStage: () => void;
  // XMB launcher cursor — transient highlight state Shell holds across mounts.
  cats: XmbCat[];
  xmbCategory: number;
  setXmbCategory: (value: number) => void;
  xmbRowByCategory: Record<string, number>;
  setXmbRowByCategory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

type CatalogBundle = {
  catalog: ScreenData;
  toplists: VibeCollection[];
  daily: VibeTrack[];
  searchQuery: string;
  search: (query: string) => Promise<SearchResults>;
  setSeedQuery: (query: string) => void;
};

type LibraryBundle = {
  libraryData: ScreenData;
  libraryTab: LibrarySectionTab;
  libraryView: CollectionViewMode;
  setLibraryTab: (tab: LibrarySectionTab) => void;
  setLibraryView: (view: CollectionViewMode) => void;
  liked: Set<string>;
  isLiked: boolean;
  toggleLike: (track: VibeTrack) => void;
  history: readonly VibeTrack[];
  playRecord: { week: VibeTrack[]; all: VibeTrack[] };
};

type ContentBundle = {
  lyrics: readonly Lyric[];
  comments: VibeComment[];
  detail: DetailTarget | null;
  artistObj: ArtistTarget;
};

type MusicVideoBundle = {
  musicVideoObj: VibeMusicVideo | null;
  musicVideos: VibeMusicVideo[];
  musicVideosLoading: boolean;
  musicVideoRail: VibeMusicVideo[];
  musicVideoComments: VibeComment[];
  playbackPolicy: MusicVideoAvailabilityPolicy;
};

type SettingsBundle = {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  accent: string;
  setAccent: (accent: string) => void;
  accentOptions: string[];
  nowPlayingInitialMode: NowPlayingMode;
};

type Props = {
  view: string;
  playback: PlaybackBundle;
  navigation: NavigationBundle;
  catalog: CatalogBundle;
  library: LibraryBundle;
  content: ContentBundle;
  musicVideo: MusicVideoBundle;
  settings: SettingsBundle;
};

export function ShellScreenRouter(props: Props) {
  const { view } = props;
  const {
    playing,
    current,
    hasCurrentTrack,
    queue,
    onPlay,
    onPause,
    onNext,
    onPrev,
    selectTrack,
    removeFromQueue,
    clearQueue,
    shufflePlay,
  } = props.playback;
  const {
    goBack,
    startForward,
    openDetail,
    albumDetail,
    openChart,
    openArtist,
    openLibrary,
    openMusicVideo,
    openMusicVideoTheater,
    openStage,
    cats,
    xmbCategory,
    setXmbCategory,
    xmbRowByCategory,
    setXmbRowByCategory,
  } = props.navigation;
  const { catalog, toplists, daily, searchQuery, search, setSeedQuery } = props.catalog;
  const {
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
  } = props.library;
  const { lyrics, comments, detail, artistObj } = props.content;
  const {
    musicVideoObj,
    musicVideos,
    musicVideosLoading,
    musicVideoRail,
    musicVideoComments,
    playbackPolicy: musicVideoPlaybackPolicy,
  } = props.musicVideo;
  const { settings, setSettings, accent, setAccent, accentOptions } = props.settings;
  const route = resolveShellScreen(view, detail, musicVideoObj);
  if (!route) return null;

  switch (route.kind) {
    case "xmb": {
      return (
        <XMB
          cats={cats}
          accent={accent}
          playing={playing}
          np={
            hasCurrentTrack
              ? { image: current.image, seed: current.coverSeed, grad: current.gradient }
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
    }

    case "home": {
      return (
        <ForYouScreen
          data={catalog}
          daily={daily}
          accent={accent}
          openPlaylist={openDetail}
          openAlbum={albumDetail}
          openArtist={openArtist}
          openLibrary={openLibrary}
          onPlay={onPlay}
        />
      );
    }

    case "search": {
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
          openPlaylist={openDetail}
          openAlbum={albumDetail}
          search={search}
        />
      );
    }

    case "music-videos": {
      return (
        <MusicVideosScreen
          videos={musicVideos}
          isLoading={musicVideosLoading}
          accent={accent}
          onOpenVideo={openMusicVideo}
        />
      );
    }

    case "mv-detail": {
      return (
        <MusicVideoDetailScreen
          video={route.video}
          related={musicVideoRail}
          accent={accent}
          playbackPolicy={musicVideoPlaybackPolicy}
          onPlay={(mv) => {
            onPause();
            openMusicVideoTheater(mv);
          }}
          onOpenVideo={openMusicVideo}
          onOpenArtist={openArtist}
        />
      );
    }

    case "mv-theater": {
      return (
        <MusicVideoTheaterScreen
          video={route.video}
          comments={musicVideoComments}
          accent={accent}
          playbackPolicy={musicVideoPlaybackPolicy}
          onClose={goBack}
        />
      );
    }

    case "charts": {
      return <ChartsScreen data={{ charts: toplists }} onOpenChart={openChart} />;
    }

    case "library": {
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
    }

    case "detail": {
      return (
        <PlaylistDetailScreen
          playlist={route.detail}
          onPlay={onPlay}
          current={current}
          playing={playing}
          liked={liked}
          toggleLike={toggleLike}
          accent={accent}
          onOpenArtist={openArtist}
          onShufflePlay={shufflePlay}
        />
      );
    }

    case "queue": {
      return (
        <QueueScreen
          current={current}
          queue={queue}
          onPlay={selectTrack}
          playing={playing}
          liked={liked}
          toggleLike={toggleLike}
          accent={accent}
          onOpenArtist={openArtist}
          onRemoveFromQueue={removeFromQueue}
          onClearQueue={clearQueue}
        />
      );
    }

    case "history": {
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
    }

    case "settings": {
      return (
        <SettingsScreen
          accent={accent}
          setAccent={setAccent}
          accentOptions={accentOptions}
          settings={settings}
          setSettings={setSettings}
        />
      );
    }

    case "artist": {
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
          onOpenAlbum={albumDetail}
          onOpenArtist={openArtist}
        />
      );
    }

    case "profile": {
      return (
        <ProfileScreen
          accent={accent}
          playlists={libraryData.playlists}
          onOpenPlaylist={openDetail}
        />
      );
    }

    case "comments": {
      return (
        <CommentsScreen
          track={current}
          comments={comments}
          accent={accent}
          liked={isLiked}
          toggleLike={() => current && toggleLike(current)}
        />
      );
    }

    case "np": {
      return (
        <NowPlaying
          track={current}
          accent={accent}
          liked={isLiked}
          toggleLike={() => current && toggleLike(current)}
          lyrics={lyrics}
          comments={comments}
          queue={queue}
          onPlay={selectTrack}
          current={current}
          onNext={onNext}
          onPrev={onPrev}
          onRemoveFromQueue={removeFromQueue}
          onClearQueue={clearQueue}
          initialMode={props.settings.nowPlayingInitialMode}
          onClose={goBack}
          onOpenStage={openStage}
          onOpenArtist={openArtist}
        />
      );
    }

    case "stage": {
      return <Stage track={current} accent={accent} playing={playing} onClose={goBack} />;
    }
  }
}
