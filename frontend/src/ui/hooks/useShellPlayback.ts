import { useCallback } from "react";

import { RepeatMode } from "@domain/model/repeat";

import { PLACEHOLDER_TRACK } from "@/model/defaults";
import { useVibePlayback } from "@/hooks/useVibePlayback";

export function useShellPlayback() {
  const playback = useVibePlayback();
  const {
    play: playFn,
    togglePlay,
    toggleShuffle,
    toggleRepeat,
    next: playNextFn,
    prev: playPrevFn,
  } = playback;

  const current = playback.current ?? PLACEHOLDER_TRACK;
  const playing = playback.playing;
  const shuffle = playback.shuffle;
  const repeat = playback.repeat !== RepeatMode.OFF;
  const repeatOne = playback.repeat === RepeatMode.ONE;
  const queue = playback.upNext;

  const onTogglePlay = useCallback(() => togglePlay(), [togglePlay]);
  const onToggleShuffle = useCallback(() => toggleShuffle(), [toggleShuffle]);
  const onToggleRepeat = useCallback(() => toggleRepeat(), [toggleRepeat]);
  const playNext = useCallback(() => playNextFn(), [playNextFn]);
  const playPrev = useCallback(() => playPrevFn(), [playPrevFn]);

  return {
    playback,
    playFn,
    current,
    playing,
    shuffle,
    repeat,
    repeatOne,
    queue,
    togglePlay,
    onTogglePlay,
    onToggleShuffle,
    onToggleRepeat,
    playNext,
    playPrev,
  };
}
