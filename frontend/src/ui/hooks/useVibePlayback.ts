import { useCallback, useEffect, useMemo, useState } from "react";

import { PlayState } from "@core/plugin";
import { RepeatMode } from "@domain/model/repeat";

import { useEngine } from "@/hooks/useEngine";
import { usePlaybackService } from "@/hooks/usePlaybackService";
import { usePlayQueueStore } from "@/store/playqueue";
import { toTrack } from "@/model/adapters/track";
import type { VibeTrack } from "@/model/vibe";
import { currentTrackView, playbackQueueView, upNextView } from "@/model/playback";

/**
 * Bridge between the vibe UI and PlaybackService.
 *
 * Reads are projected from the domain queue into VibeTrack display shapes;
 * writes go back through PlaybackService with domain Tracks. Kernel events are
 * mirrored here because shuffle/repeat/volume are live playback state, not
 * catalog data.
 */
export function useVibePlayback() {
  const engine = useEngine();
  const playbackService = usePlaybackService();

  const domainTrack = usePlayQueueStore.use.track();
  const domainTracks = usePlayQueueStore.use.tracks();
  const playState = usePlayQueueStore.use.playState();
  const playing = playState === PlayState.PLAYING;

  const current = useMemo(() => currentTrackView(domainTrack), [domainTrack]);
  const tracks = useMemo(() => playbackQueueView(domainTracks), [domainTracks]);
  const upNext = useMemo(() => upNextView(domainTracks, domainTrack), [domainTracks, domainTrack]);

  const [shuffle, setShuffleState] = useState(false);
  const [repeat, setRepeatState] = useState<RepeatMode>(RepeatMode.OFF);
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
    toggleShuffle,
    toggleRepeat,
    seek,
    setVolume,
  };
}
