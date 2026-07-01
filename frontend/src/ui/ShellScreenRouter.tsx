import type React from "react";

import type {
  ArtistTarget,
  DetailTarget,
  ScreenData,
  VibeCollection,
  VibeComment,
  VibeMusicVideo,
  VibeArtist,
  VibeTrack,
} from "@/model/adapt";
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
import { NowPlaying, type LyricLine } from "@/screens/NowPlaying";
import {
  MusicVideoDetailScreen,
  MusicVideoTheaterScreen,
  MusicVideosScreen,
} from "@/screens/MusicVideos";

type SearchResults = {
  tracks: VibeTrack[];
  artists: VibeArtist[];
  albums: VibeCollection[];
  playlists: VibeCollection[];
};

type Props = {
  view: string;
  cats: XmbCat[];
  accent: string;
  playing: boolean;
  current: VibeTrack;
  hasCurrentTrack: boolean;
  queue: VibeTrack[];
  catalog: ScreenData;
  daily: VibeTrack[];
  libraryData: ScreenData;
  toplists: VibeCollection[];
  searchQuery: string;
  search: (query: string) => Promise<SearchResults>;
  settings: Settings;
  liked: Set<string>;
  isLiked: boolean;
  lyrics: LyricLine[];
  comments: VibeComment[];
  history: VibeTrack[];
  playRecord: { week: VibeTrack[]; all: VibeTrack[] };
  libraryTab: string;
  libraryView: string;
  detail: DetailTarget | null;
  artistObj: ArtistTarget;
  musicVideoObj: VibeMusicVideo | null;
  musicVideos: VibeMusicVideo[];
  musicVideosLoading: boolean;
  musicVideoRail: VibeMusicVideo[];
  musicVideoComments: VibeComment[];
  heroTreatment: "mono" | "color";
  accentOptions: string[];
  progressSec: number;
  xmbCategory: number;
  setXmbCategory: (value: number) => void;
  xmbRowByCategory: Record<string, number>;
  setXmbRowByCategory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  startForward: (item: XmbItemModel, rect: DOMRect) => void;
  setSeedQuery: (query: string) => void;
  setLibraryTab: (tab: string) => void;
  setLibraryView: (view: string) => void;
  setAccent: (accent: string) => void;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  navigate: (view: string) => void;
  goBack: () => void;
  openDetail: (target: VibeCollection) => void;
  albumDetail: (target: VibeCollection) => void;
  openChart: (target: VibeCollection) => void;
  openArtist: (target: ArtistTarget) => void;
  openMusicVideo: (video: VibeMusicVideo) => void;
  openMusicVideoTheater: (video: VibeMusicVideo) => void;
  onPlay: (track: VibeTrack | undefined) => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  toggleLike: (id: string) => void;
  shufflePlay: (tracks: VibeTrack[]) => void;
};

export function ShellScreenRouter({
  view,
  cats,
  accent,
  playing,
  current,
  hasCurrentTrack,
  queue,
  catalog,
  daily,
  libraryData,
  toplists,
  searchQuery,
  search,
  settings,
  liked,
  isLiked,
  lyrics,
  comments,
  history,
  playRecord,
  libraryTab,
  libraryView,
  detail,
  artistObj,
  musicVideoObj,
  musicVideos,
  musicVideosLoading,
  musicVideoRail,
  musicVideoComments,
  heroTreatment,
  accentOptions,
  progressSec,
  xmbCategory,
  setXmbCategory,
  xmbRowByCategory,
  setXmbRowByCategory,
  startForward,
  setSeedQuery,
  setLibraryTab,
  setLibraryView,
  setAccent,
  setSettings,
  navigate,
  goBack,
  openDetail,
  albumDetail,
  openChart,
  openArtist,
  openMusicVideo,
  openMusicVideoTheater,
  onPlay,
  onPause,
  onNext,
  onPrev,
  toggleLike,
  shufflePlay,
}: Props) {
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
        progressSec={progressSec}
        initialMode={settings.npMode === "LYRICS" ? "lyrics" : "cover"}
        onClose={goBack}
        onOpenArtist={openArtist}
      />
    );
  }

  return null;
}
