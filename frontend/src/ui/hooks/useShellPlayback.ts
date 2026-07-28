import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { RepeatMode } from "@contexts/playback";

import { placeholderTrack } from "@/model/defaults";
import { useVibePlayback } from "@/hooks/useVibePlayback";

export function useShellPlayback() {
  const { t } = useTranslation();
  const playback = useVibePlayback();
  const {
    play: playFn,
    togglePlay,
    toggleShuffle,
    toggleRepeat,
    next: playNextFn,
    prev: playPrevFn,
  } = playback;

  // Stable identity: the idle track is compared by reference all over the shell.
  const idleTrack = useMemo(() => placeholderTrack(t("player.notPlaying")), [t]);
  const current = playback.current ?? idleTrack;
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
