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

import type { Personalized } from "@domain/model/personalized";
import { PlayState } from "@core/plugin";
import { RepeatMode } from "@domain/model/repeat";

import { useEngine } from "@/hooks/useEngine";
import { useMediaService } from "@/hooks/useMediaService";
import { usePlaybackService } from "@/hooks/usePlaybackService";
import { usePlayQueueStore } from "@/store/playqueue";

import {
  seedOf,
  toTrack,
  toVibeAlbum,
  toVibeArtist,
  toVibePlaylist,
  toVibeTrack,
  toVibeTracks,
  type ScreenData,
  type VibeCollection,
  type VibeTrack,
} from "@/model/adapt";

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
    events.on("shuffle_enable_changed", setShuffleState);
    events.on("repeat_mode_changed", setRepeatState);
    events.on("volume_changed", setVolumeState);
    return () => {
      events.off("shuffle_enable_changed", setShuffleState);
      events.off("repeat_mode_changed", setRepeatState);
      events.off("volume_changed", setVolumeState);
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

  const togglePlay = useCallback(
    () => playbackService.togglePlay(playing),
    [playbackService, playing],
  );
  const next = useCallback(() => playbackService.next(), [playbackService]);
  const prev = useCallback(() => playbackService.previous(), [playbackService]);
  const toggleShuffle = useCallback(() => playbackService.toggleShuffle(), [playbackService]);
  const toggleRepeat = useCallback(() => playbackService.cycleRepeat(), [playbackService]);
  const seek = useCallback((pct: number) => playbackService.seek(pct), [playbackService]);
  const setVolume = useCallback((v: number) => playbackService.setVolume(v), [playbackService]);

  // Up-next: the queue after the current track; used by NowPlaying / Queue.
  const upNext = useMemo(() => {
    if (!current) return tracks;
    const i = tracks.findIndex((t) => t.id === current.id);
    return i >= 0 ? tracks.slice(i + 1) : tracks;
  }, [tracks, current]);

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
    togglePlay,
    next,
    prev,
    toggleShuffle,
    toggleRepeat,
    seek,
    setVolume,
  };
}

// ── Catalog (home / XMB) ─────────────────────────────────────────────

function buildCatalog(p?: Personalized): ScreenData {
  return {
    playlists: (p?.playlists ?? []).map(toVibePlaylist),
    albums: (p?.albums ?? []).map(toVibeAlbum),
    artists: (p?.artists ?? []).map(toVibeArtist),
    allTracks: toVibeTracks(p?.tracks),
  };
}

export function useCatalog() {
  const media = useMediaService();
  const { data, isLoading } = useQuery({
    queryKey: ["personalized", media.providerName],
    queryFn: () => media.personalized(),
  });
  const catalog = useMemo(() => buildCatalog(data), [data]);
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
      };
    },
    [media],
  );
}

/**
 * Current-track lyrics in the NowPlaying { line, t } shape ([] when none).
 * Pure read of kernel-owned reactive state: the Lyric plugin follows
 * current_track_changed and pins lyric_changed into the store. The UI doesn't
 * fetch lyrics or pass a track id — it just renders what's current.
 */
export function useLyric() {
  const lyric = usePlayQueueStore.use.lyric();
  return useMemo(() => lyric.map((l) => ({ line: l.content, t: l.duration })), [lyric]);
}

/** Chart list in vibe shape, for the Charts grid. */
export function useToplists(): VibeCollection[] {
  const media = useMediaService();
  const { data } = useQuery({
    queryKey: ["toplists", media.providerName],
    queryFn: () => media.toplists(),
  });
  return useMemo<VibeCollection[]>(
    () =>
      (data ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        name: c.title,
        kind: "Chart",
        image: c.image,
        coverSeed: seedOf(c.id),
        sub: c.period,
        updatedAt: c.period ?? "today",
        tracks: [],
      })),
    [data],
  );
}
