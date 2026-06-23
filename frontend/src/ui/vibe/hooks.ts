/**
 * Bridge hooks between the vibe UI and the real kernel.
 *   - useVibePlayback wraps kernel playback state (usePlayQueueStore +
 *     planet.hooks) into the current/playing/queue/controls the screens expect.
 *     The queue holds vibe-shaped tracks (the kernel only reads id + playUrl),
 *     so reads need no remapping.
 *   - useCatalog projects provider.personalized() into the vibe catalog (home / XMB).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { Personalized } from "@domain/model/personalized";
import { PlayState } from "@core/plugin";
import { RepeatMode } from "@core/plugin/playqueue/repeat";

import { usePlanet } from "@/hooks/usePlanet";
import { useActiveProvider } from "@/hooks/useActiveProvider";
import { usePlayQueueStore } from "@/store/playqueue";

import {
  seedOf,
  toVibeAlbum,
  toVibeArtist,
  toVibePlaylist,
  toVibeTracks,
  type VibeTrack,
} from "./adapt";

// Playback

export function useVibePlayback() {
  const planet = usePlanet();
  const provider = useActiveProvider();

  // The queue holds vibe-shaped tracks (cast on the way in), so reads are VibeTrack directly.
  const current = usePlayQueueStore.use.track() as unknown as VibeTrack | undefined;
  const tracks = usePlayQueueStore.use.tracks() as unknown as VibeTrack[];
  const playState = usePlayQueueStore.use.playState();
  const progress = usePlayQueueStore.use.progress();
  const duration = usePlayQueueStore.use.duration();
  const playing = playState === PlayState.PLAYING;

  const [shuffle, setShuffleState] = useState(false);
  const [repeat, setRepeatState] = useState<RepeatMode>(RepeatMode.OFF);
  const [volume, setVolumeState] = useState(0);

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

  /** Set vibe tracks as the play queue and start at the given track, resolving real
   *  play URLs first. The kernel queue holds the vibe shapes (deduped by id, playUrl
   *  read on play), so current_track_changed echoes vibe shapes back and screens stay consistent. */
  const play = useCallback(
    async (list: VibeTrack[], track: VibeTrack, key = "vibe") => {
      const queue = list?.length ? list : [track];
      const ids = queue.map((t) => t.id).filter(Boolean);
      try {
        const urls = await provider.playUrls(ids);
        for (const u of urls) {
          const t = queue.find((x) => x.id === u.id);
          if (t) {
            t.playUrl = u.playUrl;
            if (t._real) t._real.playUrl = u.playUrl;
          }
        }
      } catch {
        /* Provider has no play-URL support: stay silent; the UI still switches track. */
      }
      planet.hooks.emit("change_play_queue", {
        key,
        tracks: queue as any,
        track: track as any,
      });
    },
    [planet, provider],
  );

  const togglePlay = useCallback(() => {
    planet.hooks.emit(playing ? "pause" : "play");
  }, [planet, playing]);

  const next = useCallback(() => planet.hooks.emit("next_track"), [planet]);
  const prev = useCallback(() => planet.hooks.emit("previous_track"), [planet]);
  const toggleShuffle = useCallback(() => planet.hooks.emit("change_shuffle_enable"), [planet]);
  const toggleRepeat = useCallback(() => planet.hooks.emit("change_repeat_mode"), [planet]);
  const seek = useCallback((pct: number) => planet.hooks.emit("play_time_seek", pct), [planet]);
  const setVolume = useCallback((v: number) => planet.hooks.emit("change_volume", v), [planet]);

  // Up-next: the queue after the current track; used by NowPlaying / Queue.
  const upNext = useMemo(() => {
    if (!current) return tracks ?? [];
    const i = (tracks ?? []).findIndex((t) => t.id === current.id);
    return i >= 0 ? (tracks ?? []).slice(i + 1) : (tracks ?? []);
  }, [tracks, current]);

  return {
    current,
    tracks: tracks ?? [],
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

// Catalog (home / XMB)

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

export type VibeCatalog = ReturnType<typeof buildCatalog>;

export function useCatalog() {
  const provider = useActiveProvider();
  const { data, isLoading } = useQuery({
    queryKey: ["personalized", provider.name],
    queryFn: () => provider.personalized(),
  });
  const catalog = useMemo(() => buildCatalog(data), [data]);
  return { catalog, isLoading };
}

// Search / charts

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
