/**
 * Bridge hooks between the vibe UI and the application/kernel layers.
 *   - useVibePlayback wraps playback state (usePlayQueueStore + planet.hooks
 *     for state subscriptions) and delegates all commands to PlaybackService.
 *     The queue holds domain Tracks (the kernel only reads id + playUrl);
 *     reads adapt domain → VibeTrack for display, writes adapt VibeTrack →
 *     domain Track for playback.
 *   - useCatalog projects provider.personalized() into the vibe catalog (home / XMB).
 *   - useProviderSearch / useLyric / useToplists are data-fetching hooks that
 *     read through the IProvider port + React Query.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { Personalized } from "@domain/model/personalized";
import { PlayState } from "@core/plugin";
import { RepeatMode } from "@core/plugin/playqueue/repeat";

import { usePlanet } from "@/hooks/usePlanet";
import { useActiveProvider } from "@/hooks/useActiveProvider";
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
  type VibeTrack,
} from "./adapt";

// ── Playback ────────────────────────────────────────────────────────

export function useVibePlayback() {
  const planet = usePlanet();
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
    planet.hooks.on("shuffle_enable_changed", setShuffleState);
    planet.hooks.on("repeat_mode_changed", setRepeatState);
    planet.hooks.on("volume_changed", setVolumeState);
    return () => {
      planet.hooks.off("shuffle_enable_changed", setShuffleState);
      planet.hooks.off("repeat_mode_changed", setRepeatState);
      planet.hooks.off("volume_changed", setVolumeState);
    };
  }, [planet]);

  // ── Commands (delegated to PlaybackService — no business logic in UI) ──

  /** Set vibe tracks as the play queue and start at the given track. */
  const play = useCallback(
    async (list: VibeTrack[], track: VibeTrack, key = "vibe") => {
      const domainList = (list?.length ? list : [track]).map(toTrack);
      const domainTrack = toTrack(track);
      await playbackService.play(domainList, domainTrack, key);
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
  const toggleRepeat = useCallback(() => playbackService.toggleRepeat(), [playbackService]);
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

function buildCatalog(p?: Personalized) {
  const playlists = (p?.playlists ?? []).map(toVibePlaylist);
  const albums = (p?.albums ?? []).map(toVibeAlbum);
  const artists = (p?.artists ?? []).map(toVibeArtist);
  const allTracks = toVibeTracks(p?.tracks);
  return {
    playlists,
    albums,
    artists,
    data: {
      quick: [...playlists, ...albums].slice(0, 6),
      madeFor: playlists,
      recent: albums,
      popular: albums.slice().reverse(),
      jumpBack: playlists.slice().reverse(),
      allTracks,
    },
  };
}

export function useCatalog() {
  const provider = useActiveProvider();
  const { data, isLoading } = useQuery({
    queryKey: ["personalized", provider.name],
    queryFn: () => provider.personalized(),
  });
  const catalog = useMemo(() => buildCatalog(data), [data]);
  return { catalog, isLoading };
}

// ── Search / charts ──────────────────────────────────────────────────

/** Returns a search(query) that calls provider.search and projects to vibe shapes. */
export function useProviderSearch() {
  const provider = useActiveProvider();
  return useCallback(
    async (query: string) => {
      const r = await provider.search(query);
      return {
        tracks: toVibeTracks(r.tracks),
        artists: (r.artists ?? []).map(toVibeArtist),
        albums: (r.albums ?? []).map(toVibeAlbum),
      };
    },
    [provider],
  );
}

/** Real lyrics for the current track, projected to the NowPlaying { line } shape ([] when none). */
export function useLyric(id: string | undefined) {
  const provider = useActiveProvider();
  const { data } = useQuery({
    queryKey: ["lyric", provider.name, id],
    queryFn: () => provider.lyric(id as string),
    enabled: !!id,
  });
  return useMemo(() => (data ?? []).map((l) => ({ line: l.content, t: l.duration })), [data]);
}

/** Chart list in vibe shape, for the Charts grid. */
export function useToplists() {
  const provider = useActiveProvider();
  const { data } = useQuery({
    queryKey: ["toplists", provider.name],
    queryFn: () => provider.toplists(),
  });
  return useMemo(
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
      })),
    [data],
  );
}
