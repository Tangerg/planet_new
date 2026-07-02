import type React from "react";

import type {
  ArtistTarget,
  DetailTarget,
  ScreenData,
  SearchResults,
  VibeCollection,
  VibeComment,
  VibeMusicVideo,
  VibeTrack,
} from "@/model/vibe";
import type { Lyric } from "@domain/model/lyric";
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
import { MusicVideosScreen } from "@/screens/music-videos/MusicVideosScreen";
import { MusicVideoDetailScreen } from "@/screens/music-videos/MusicVideoDetailScreen";
import { MusicVideoTheaterScreen } from "@/screens/music-videos/MusicVideoTheaterScreen";

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
  shufflePlay: (tracks: VibeTrack[]) => void;
};

type NavigationBundle = {
  navigate: (view: string) => void;
  goBack: () => void;
  startForward: (item: XmbItemModel, rect: DOMRect) => void;
  openDetail: (target: VibeCollection) => void;
  albumDetail: (target: VibeCollection) => void;
  openChart: (target: VibeCollection) => void;
  openArtist: (target: ArtistTarget) => void;
  openMusicVideo: (video: VibeMusicVideo) => void;
  openMusicVideoTheater: (video: VibeMusicVideo) => void;
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
  libraryTab: string;
  libraryView: string;
  setLibraryTab: (tab: string) => void;
  setLibraryView: (view: string) => void;
  liked: Set<string>;
  isLiked: boolean;
  toggleLike: (id: string) => void;
  history: VibeTrack[];
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
};

type SettingsBundle = {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  accent: string;
  setAccent: (accent: string) => void;
  accentOptions: string[];
  heroTreatment: "mono" | "color";
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
  const { playing, current, hasCurrentTrack, queue, onPlay, onPause, onNext, onPrev, shufflePlay } =
    props.playback;
  const {
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
  const { musicVideoObj, musicVideos, musicVideosLoading, musicVideoRail, musicVideoComments } =
    props.musicVideo;
  const { settings, setSettings, accent, setAccent, accentOptions, heroTreatment } = props.settings;
  const mono = heroTreatment === "mono";

  if (view === "xmb") {
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

  if (view === "home") {
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
  }

  if (view === "search") {
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

  if (view === "music-videos") {
    return (
      <MusicVideosScreen
        videos={musicVideos}
        isLoading={musicVideosLoading}
        accent={accent}
        onOpenVideo={openMusicVideo}
      />
    );
  }

  if (view === "mv-detail" && musicVideoObj) {
    return (
      <MusicVideoDetailScreen
        video={musicVideoObj}
        related={musicVideoRail}
        accent={accent}
        onPlay={(mv) => {
          onPause();
          openMusicVideoTheater(mv);
        }}
        onOpenVideo={openMusicVideo}
        onOpenArtist={openArtist}
      />
    );
  }

  if (view === "mv-theater" && musicVideoObj) {
    return (
      <MusicVideoTheaterScreen
        video={musicVideoObj}
        comments={musicVideoComments}
        accent={accent}
        onClose={goBack}
      />
    );
  }

  if (view === "charts")
    return <ChartsScreen data={{ charts: toplists }} onOpenChart={openChart} />;

  if (view === "library") {
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

  if (view === "detail" && detail) {
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
        onShufflePlay={shufflePlay}
      />
    );
  }

  if (view === "queue") {
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
  }

  if (view === "history") {
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

  if (view === "settings") {
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

  if (view === "artist") {
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
        mono={mono}
        onOpenAlbum={albumDetail}
        onOpenArtist={openArtist}
      />
    );
  }

  if (view === "profile") {
    return (
      <ProfileScreen
        accent={accent}
        playlists={libraryData.playlists}
        onOpenPlaylist={openDetail}
        mono={mono}
      />
    );
  }

  if (view === "comments") {
    return (
      <CommentsScreen
        track={current}
        comments={comments}
        accent={accent}
        liked={isLiked}
        toggleLike={() => current && toggleLike(current.id)}
        mono={mono}
      />
    );
  }

  if (view === "np") {
    return (
      <NowPlaying
        track={current}
        accent={accent}
        liked={isLiked}
        toggleLike={() => current && toggleLike(current.id)}
        lyrics={lyrics}
        comments={comments}
        mono={mono}
        queue={queue}
        onPlay={onPlay}
        current={current}
        onNext={onNext}
        onPrev={onPrev}
        initialMode={settings.npMode === "LYRICS" ? "lyrics" : "cover"}
        onClose={goBack}
        onOpenArtist={openArtist}
      />
    );
  }

  return null;
}
