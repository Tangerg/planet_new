/**
 * Bridge hooks between the vibe UI and the application/kernel layers. The UI
 * holds only the Engine facade — never the provider or the event bus directly.
 *   - useVibePlayback wraps playback state (usePlayQueueStore + engine.events
 *     for state subscriptions) and delegates all commands to PlaybackService.
 *     The queue holds domain Tracks (the kernel only reads id + playUrl);
 *     reads adapt domain → VibeTrack for display, writes adapt VibeTrack →
 *     domain Track for playback.
 *   - useCatalog projects media.personalized() into the vibe catalog (home / XMB).
 *   - useProviderSearch / useLyric / useToplists are data-fetching hooks that
 *     read through the MediaService use-case layer + React Query (cache).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PlayState } from "@core/plugin";
import { PlayQueue } from "@domain/model/play-queue";
import { RepeatMode } from "@domain/model/repeat";
import { Artist } from "@domain/model/artist";

import { useEngine } from "@/hooks/useEngine";
import { useMediaService } from "@/hooks/useMediaService";
import { useLibraryService } from "@/hooks/useLibraryService";
import { usePlaybackService } from "@/hooks/usePlaybackService";
import { usePlayQueueStore } from "@/store/playqueue";
import { useAuthStore } from "@/store/auth";

import {
  toTrack,
  toVibeAlbum,
  toVibeArtist,
  toVibeComment,
  toVibeMusicVideos,
  toVibePlaylist,
  toVibeTrack,
  toVibeTracks,
  type VibeComment,
  type VibeCollection,
  type VibeArtist,
  type VibeMusicVideo,
  type VibeTrack,
} from "@/model/adapt";
import { catalogScreenData, toVibeCharts } from "@/model/catalog";
import { queryKeys } from "@/model/queryKeys";

// ── Playback ────────────────────────────────────────────────────────

export function useVibePlayback() {
  const engine = useEngine();
  const playbackService = usePlaybackService();

  // Read domain Track from the store and adapt to VibeTrack for display.
  const domainTrack = usePlayQueueStore.use.track();
  const domainTracks = usePlayQueueStore.use.tracks();
  const playState = usePlayQueueStore.use.playState();
  const progress = usePlayQueueStore.use.progress();
  const duration = usePlayQueueStore.use.duration();
  const playing = playState === PlayState.PLAYING;

  const current = useMemo(
    () => (domainTrack ? toVibeTrack(domainTrack) : undefined),
    [domainTrack],
  );
  const tracks = useMemo(() => (domainTracks ?? []).map((t) => toVibeTrack(t)), [domainTracks]);

  // State subscriptions (shuffle / repeat / volume) — these are state reads,
  // not business logic. The kernel broadcasts changes; the UI mirrors them.
  const [shuffle, setShuffleState] = useState(false);
  const [repeat, setRepeatState] = useState<RepeatMode>(RepeatMode.OFF);
  // Audio elements default to volume 1.0 (=100 on the kernel scale) and the
  // Volume plugin doesn't broadcast that initial value, so seed it here.
  const [volume, setVolumeState] = useState(100);

  useEffect(() => {
    const { events } = engine;
    events.on("queue:shuffle-changed", setShuffleState);
    events.on("queue:repeat-changed", setRepeatState);
    events.on("volume:changed", setVolumeState);
    return () => {
      events.off("queue:shuffle-changed", setShuffleState);
      events.off("queue:repeat-changed", setRepeatState);
      events.off("volume:changed", setVolumeState);
    };
  }, [engine]);

  // ── Commands (delegated to PlaybackService — no business logic in UI) ──

  /** Set vibe tracks as the play queue and start at the given track. */
  const play = useCallback(
    async (list: VibeTrack[], track: VibeTrack) => {
      const domainList = (list?.length ? list : [track]).map(toTrack);
      const domainTrack = toTrack(track);
      await playbackService.play(domainList, domainTrack);
    },
    [playbackService],
  );
  const shufflePlay = useCallback(
    async (list: VibeTrack[]) => {
      await playbackService.shufflePlay(list.map(toTrack));
    },
    [playbackService],
  );

  const togglePlay = useCallback(
    () => playbackService.togglePlay(playing),
    [playbackService, playing],
  );
  const pause = useCallback(() => playbackService.pause(), [playbackService]);
  const next = useCallback(() => playbackService.next(), [playbackService]);
  const prev = useCallback(() => playbackService.previous(), [playbackService]);
  const addToQueue = useCallback(
    (track: VibeTrack) => playbackService.addToQueue(toTrack(track)),
    [playbackService],
  );
  const toggleShuffle = useCallback(() => playbackService.toggleShuffle(), [playbackService]);
  const toggleRepeat = useCallback(() => playbackService.cycleRepeat(), [playbackService]);
  const seek = useCallback((pct: number) => playbackService.seek(pct), [playbackService]);
  const setVolume = useCallback((v: number) => playbackService.setVolume(v), [playbackService]);

  // Up-next: the queue after the current track; used by NowPlaying / Queue.
  const upNext = useMemo(() => {
    const domainUpNext = PlayQueue.upNext(domainTracks, domainTrack);
    return domainUpNext.map((track) => toVibeTrack(track));
  }, [domainTracks, domainTrack]);

  return {
    current,
    tracks,
    upNext,
    playing,
    progress,
    duration,
    shuffle,
    repeat,
    volume,
    play,
    shufflePlay,
    togglePlay,
    pause,
    next,
    prev,
    addToQueue,
    toggleShuffle,
    toggleRepeat,
    seek,
    setVolume,
  };
}

// ── Catalog (home / XMB) ─────────────────────────────────────────────

export function useCatalog() {
  const media = useMediaService();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.personalized(media.providerName),
    queryFn: () => media.personalized(),
  });
  const catalog = useMemo(() => catalogScreenData(data), [data]);
  return { catalog, isLoading };
}

// ── Search / charts ──────────────────────────────────────────────────

/** Returns a search(query) that calls media.search and projects to vibe shapes. */
export function useProviderSearch() {
  const media = useMediaService();
  return useCallback(
    async (query: string) => {
      const r = await media.search(query);
      return {
        tracks: toVibeTracks(r.tracks),
        artists: (r.artists ?? []).map(toVibeArtist),
        albums: (r.albums ?? []).map(toVibeAlbum),
        playlists: (r.playlists ?? []).map(toVibePlaylist),
      };
    },
    [media],
  );
}

/**
 * Current-track lyrics in the NowPlaying { line, t } shape ([] when none).
 * Pure read of kernel-owned reactive state: the Lyrics plugin follows
 * queue:current-changed and pins lyrics:changed into the store. The UI doesn't
 * fetch lyrics or pass a track id — it just renders what's current.
 */
export function useLyric() {
  const lyric = usePlayQueueStore.use.lyric();
  return useMemo(
    () => lyric.map((l) => ({ line: l.content, t: l.duration, tr: l.translation })),
    [lyric],
  );
}

/**
 * Track comments in vibe shape. Gated by the `comments` capability and an
 * `enabled` flag (the Comments screen only mounts on its own view), so we don't
 * fetch comments for every track played.
 */
export function useComments(trackId: string | undefined, enabled: boolean): VibeComment[] {
  const media = useMediaService();
  const { data } = useQuery({
    queryKey: queryKeys.comments(media.providerName, trackId),
    queryFn: () => media.comments(trackId ?? ""),
    enabled: enabled && !!trackId && media.supports("comments"),
  });
  return useMemo(() => (data ?? []).map(toVibeComment), [data]);
}

/**
 * The logged-in user's own playlists (vibe shape), for the Library Playlists
 * tab + the real "liked songs" view. Empty when anonymous / unsupported.
 */
export function useUserPlaylists(): VibeCollection[] {
  const library = useLibraryService();
  const media = useMediaService();
  const loggedIn = useAuthStore((s) => s.loggedIn);
  const { data } = useQuery({
    queryKey: queryKeys.userPlaylists(media.providerName),
    queryFn: () => library.userPlaylists(),
    enabled: loggedIn && library.supported,
  });
  return useMemo(() => (data ?? []).map(toVibePlaylist), [data]);
}

/**
 * The logged-in user's play record (vibe shape): most-played tracks over the
 * last week and all time. Empty when anonymous / unsupported — the History
 * screen then shows only this session's local plays.
 */
export function usePlayRecord(): { week: VibeTrack[]; all: VibeTrack[] } {
  const library = useLibraryService();
  const media = useMediaService();
  const loggedIn = useAuthStore((s) => s.loggedIn);
  const enabled = loggedIn && library.supported;
  const week = useQuery({
    queryKey: queryKeys.playRecord(media.providerName, "week"),
    queryFn: () => library.playRecord("week"),
    enabled,
  });
  const all = useQuery({
    queryKey: queryKeys.playRecord(media.providerName, "all"),
    queryFn: () => library.playRecord("all"),
    enabled,
  });
  return useMemo(
    () => ({ week: toVibeTracks(week.data), all: toVibeTracks(all.data) }),
    [week.data, all.data],
  );
}

/**
 * The day's personalised song recommendations ("每日推荐") in vibe shape. Empty
 * when anonymous / unsupported — ForYou then falls back to a catalog playlist.
 */
export function useDailyRecommendations(): VibeTrack[] {
  const library = useLibraryService();
  const media = useMediaService();
  const loggedIn = useAuthStore((s) => s.loggedIn);
  const { data } = useQuery({
    queryKey: queryKeys.dailyRecommendations(media.providerName),
    queryFn: () => library.dailyRecommendations(),
    enabled: loggedIn && library.supported,
  });
  return useMemo(() => toVibeTracks(data), [data]);
}

/** Chart list in vibe shape, for the Charts grid. */
export function useToplists(): VibeCollection[] {
  const media = useMediaService();
  const { data } = useQuery({
    queryKey: queryKeys.toplists(media.providerName),
    queryFn: () => media.toplists(),
  });
  return useMemo<VibeCollection[]>(() => toVibeCharts(data), [data]);
}

// ── Music videos ────────────────────────────────────────────────────

export function useMusicVideoDiscovery(artists: VibeArtist[]): {
  videos: VibeMusicVideo[];
  isLoading: boolean;
} {
  const media = useMediaService();
  const artistIds = useMemo(() => Artist.uniqueIds(artists), [artists]);
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.musicVideoDiscovery(media.providerName, artistIds),
    queryFn: () => media.discoverArtistMusicVideos(artists),
    enabled: artistIds.length > 0 && media.supports("artistMusicVideos"),
  });
  return {
    videos: useMemo(() => toVibeMusicVideos(data), [data]),
    isLoading,
  };
}

export function useArtistMusicVideos(
  artistId: string | undefined,
  enabled: boolean,
): VibeMusicVideo[] {
  const media = useMediaService();
  const { data } = useQuery({
    queryKey: queryKeys.artistMusicVideos(media.providerName, artistId),
    queryFn: () => media.artistMusicVideos(artistId ?? ""),
    enabled: enabled && !!artistId && media.supports("artistMusicVideos"),
  });
  return useMemo(() => toVibeMusicVideos(data), [data]);
}

export function useMusicVideoComments(
  musicVideoId: string | undefined,
  enabled: boolean,
): VibeComment[] {
  const media = useMediaService();
  const { data } = useQuery({
    queryKey: queryKeys.musicVideoComments(media.providerName, musicVideoId),
    queryFn: () => media.musicVideoComments(musicVideoId ?? ""),
    enabled: enabled && !!musicVideoId && media.supports("musicVideoComments"),
  });
  return useMemo(() => (data ?? []).map(toVibeComment), [data]);
}
