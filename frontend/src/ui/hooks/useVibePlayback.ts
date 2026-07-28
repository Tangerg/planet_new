import { useCallback, useMemo } from "react";

import { PlayState } from "@contexts/playback";

import { usePlaybackService } from "@/hooks/usePlaybackService";
import { usePlayQueueStore } from "@/store/playqueue";
import type { VibeTrack } from "@/model/vibe";
import {
  currentTrackView,
  playbackCommandQueue,
  playbackCommandTarget,
  playbackQueueView,
  queueCommandTrack,
  shufflePlaybackCommandQueue,
  upNextView,
} from "@/model/playback";

/**
 * Bridge between the vibe UI and PlaybackService.
 *
 * Reads are projected from the domain queue into VibeTrack display shapes;
 * writes go back through PlaybackService with domain Tracks. Every read comes
 * from the pinned store, so a component mounting mid-session sees current state.
 */
export function useVibePlayback() {
  const playbackService = usePlaybackService();

  const domainTrack = usePlayQueueStore.use.track();
  const domainTracks = usePlayQueueStore.use.tracks();
  const playState = usePlayQueueStore.use.playState();
  const playing = playState === PlayState.PLAYING;

  const current = useMemo(() => currentTrackView(domainTrack), [domainTrack]);
  const tracks = useMemo(() => playbackQueueView(domainTracks), [domainTracks]);
  const upNext = useMemo(() => upNextView(domainTracks, domainTrack), [domainTracks, domainTrack]);

  const shuffle = usePlayQueueStore.use.shuffle();
  const repeat = usePlayQueueStore.use.repeat();
  const volume = usePlayQueueStore.use.volume();

  const play = useCallback(
    async (list: VibeTrack[], track: VibeTrack) => {
      await playbackService.play(playbackCommandQueue(list, track), playbackCommandTarget(track));
    },
    [playbackService],
  );

  const shufflePlay = useCallback(
    async (list: VibeTrack[]) => {
      await playbackService.shufflePlay(shufflePlaybackCommandQueue(list));
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
    (track: VibeTrack) => playbackService.addToQueue(queueCommandTrack(track)),
    [playbackService],
  );
  const addNextToQueue = useCallback(
    (track: VibeTrack) => playbackService.addNextToQueue(queueCommandTrack(track)),
    [playbackService],
  );
  const removeFromQueue = useCallback(
    (track: VibeTrack) => playbackService.removeFromQueue(queueCommandTrack(track)),
    [playbackService],
  );
  const clearQueue = useCallback(() => playbackService.clearQueue(), [playbackService]);
  const selectTrack = useCallback(
    (track: VibeTrack) => playbackService.selectTrack(queueCommandTrack(track)),
    [playbackService],
  );
  const toggleShuffle = useCallback(() => playbackService.toggleShuffle(), [playbackService]);
  const toggleRepeat = useCallback(() => playbackService.cycleRepeat(), [playbackService]);
  const seek = useCallback((pct: number) => playbackService.seek(pct), [playbackService]);
  const setVolume = useCallback((v: number) => playbackService.setVolume(v), [playbackService]);
  const toggleMute = useCallback(() => playbackService.toggleMute(), [playbackService]);

  return {
    current,
    tracks,
    upNext,
    playing,
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
    addNextToQueue,
    removeFromQueue,
    clearQueue,
    selectTrack,
    toggleShuffle,
    toggleRepeat,
    seek,
    setVolume,
    toggleMute,
  };
}
