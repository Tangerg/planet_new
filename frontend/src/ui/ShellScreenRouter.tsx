import React, { Suspense, lazy, useCallback, useMemo } from "react";

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
  TrackListBindings,
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
import type { NowPlayingMode } from "@/model/now-playing";
import { resolveShellScreen, type ShellScreenView } from "@/model/shell-screen";

// Code-split screens. Only screens reached by a PLAIN view switch qualify: a
// shared-element morph destination must render its hero synchronously for the
// engine to measure, which a chunk still in flight cannot do. The stage (WebGL
// effects) and the video screens are both plain-switch and heavy, so they leave
// the startup chunk entirely.
const importStage = () => import("@/screens/Stage");
const importMusicVideos = () => import("@/screens/music-videos/MusicVideosScreen");
const importMusicVideoDetail = () => import("@/screens/music-videos/MusicVideoDetailScreen");
const importMusicVideoTheater = () => import("@/screens/music-videos/MusicVideoTheaterScreen");

const Stage = lazy(() => importStage().then((m) => ({ default: m.Stage })));
const MusicVideosScreen = lazy(() =>
  importMusicVideos().then((m) => ({ default: m.MusicVideosScreen })),
);
const MusicVideoDetailScreen = lazy(() =>
  importMusicVideoDetail().then((m) => ({ default: m.MusicVideoDetailScreen })),
);
const MusicVideoTheaterScreen = lazy(() =>
  importMusicVideoTheater().then((m) => ({ default: m.MusicVideoTheaterScreen })),
);

/**
 * Fetch the deferred screen chunks once the app is idle. Splitting them keeps
 * them off the STARTUP path (parse + execute before first paint); warming them
 * afterwards means the first navigation into one never waits on a fetch, so the
 * split costs nothing at the moment the user actually opens the screen.
 */
export function warmDeferredScreens(): () => void {
  const schedule =
    typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback
      : (cb: () => void) => window.setTimeout(cb, 1);
  const handle = schedule(() => {
    void importStage();
    void importMusicVideos();
    void importMusicVideoDetail();
    void importMusicVideoTheater();
  });
  return () => {
    if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(handle);
    else window.clearTimeout(handle);
  };
}

// The screen area while a chunk loads: the same full-bleed dark field every
// screen paints on, so a load reads as "not drawn yet" rather than a white flash.
const chunkFallback = <div className="h-full bg-[#08080b]" />;

function ScreenChunk({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={chunkFallback}>{children}</Suspense>;
}

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
  nowPlayingInitialMode: NowPlayingMode;
};

type Props = {
  view: ShellScreenView;
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
  const { settings, setSettings } = props.settings;

  // Derived props handed to memoized screens (XMB, NowPlaying). Built here rather
  // than inline in the branch so their identity only changes with the track —
  // an inline object/arrow would make the shallow compare fail every render and
  // turn those React.memo wrappers into pure overhead.
  const nowPlayingArt = useMemo(
    () =>
      hasCurrentTrack
        ? { image: current.image, seed: current.coverSeed, grad: current.gradient }
        : undefined,
    [hasCurrentTrack, current],
  );
  const toggleCurrentLike = useCallback(() => {
    if (current) toggleLike(current);
  }, [current, toggleLike]);

  // The bindings every track surface needs, assembled once. They are spread into
  // each screen rather than re-listed per branch: six props that always travel
  // together drift the moment they are typed out six times.
  const trackList: TrackListBindings = {
    onPlay,
    current,
    playing,
    liked,
    toggleLike,
    onOpenArtist: openArtist,
  };

  const route = resolveShellScreen(view, detail, musicVideoObj);
  if (!route) return null;

  switch (route.kind) {
    case "xmb": {
      return (
        <XMB
          cats={cats}
          playing={playing}
          np={nowPlayingArt}
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
          onOpenPlaylist={openDetail}
          onOpenAlbum={albumDetail}
          onOpenArtist={openArtist}
          onOpenLibrary={openLibrary}
          onPlay={onPlay}
        />
      );
    }

    case "search": {
      return (
        <SearchScreen
          {...trackList}
          query={searchQuery}
          onQuery={setSeedQuery}
          onOpenPlaylist={openDetail}
          onOpenAlbum={albumDetail}
          search={search}
        />
      );
    }

    case "music-videos": {
      return (
        <ScreenChunk>
          <MusicVideosScreen
            videos={musicVideos}
            isLoading={musicVideosLoading}
            onOpenVideo={openMusicVideo}
          />
        </ScreenChunk>
      );
    }

    case "mv-detail": {
      return (
        <ScreenChunk>
          <MusicVideoDetailScreen
            video={route.video}
            related={musicVideoRail}
            playbackPolicy={musicVideoPlaybackPolicy}
            onPlay={(mv) => {
              onPause();
              openMusicVideoTheater(mv);
            }}
            onOpenVideo={openMusicVideo}
            onOpenArtist={openArtist}
          />
        </ScreenChunk>
      );
    }

    case "mv-theater": {
      return (
        <ScreenChunk>
          <MusicVideoTheaterScreen
            video={route.video}
            comments={musicVideoComments}
            playbackPolicy={musicVideoPlaybackPolicy}
            onClose={goBack}
          />
        </ScreenChunk>
      );
    }

    case "charts": {
      return <ChartsScreen data={{ charts: toplists }} onOpenChart={openChart} />;
    }

    case "library": {
      return (
        <LibraryScreen
          {...trackList}
          tab={libraryTab}
          view={libraryView}
          onTab={setLibraryTab}
          onView={setLibraryView}
          data={libraryData}
          onOpenPlaylist={openDetail}
          onOpenAlbum={albumDetail}
        />
      );
    }

    case "detail": {
      return (
        <PlaylistDetailScreen {...trackList} playlist={route.detail} onShufflePlay={shufflePlay} />
      );
    }

    case "queue": {
      return (
        <QueueScreen
          {...trackList}
          queue={queue}
          /* The queue plays by SELECTING an already-queued track, rather than
             replacing the queue the way every other surface's onPlay does. */
          onPlay={selectTrack}
          onRemoveFromQueue={removeFromQueue}
          onClearQueue={clearQueue}
        />
      );
    }

    case "history": {
      return (
        <HistoryScreen
          {...trackList}
          session={history}
          week={playRecord.week}
          all={playRecord.all}
        />
      );
    }

    case "settings": {
      return <SettingsScreen settings={settings} setSettings={setSettings} />;
    }

    case "artist": {
      return (
        <ArtistScreen
          {...trackList}
          artist={artistObj}
          tracks={artistObj?.tracks ?? []}
          albums={artistObj?.albums ?? []}
          similar={artistObj?.similar ?? []}
          onOpenAlbum={albumDetail}
        />
      );
    }

    case "profile": {
      return <ProfileScreen playlists={libraryData.playlists} onOpenPlaylist={openDetail} />;
    }

    case "comments": {
      return (
        <CommentsScreen
          track={current}
          comments={comments}
          liked={isLiked}
          toggleLike={toggleCurrentLike}
        />
      );
    }

    case "np": {
      return (
        <NowPlaying
          track={current}
          liked={isLiked}
          toggleLike={toggleCurrentLike}
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
      return (
        <ScreenChunk>
          <Stage track={current} playing={playing} onClose={goBack} />
        </ScreenChunk>
      );
    }
  }
}
