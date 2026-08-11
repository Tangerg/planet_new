import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { RepeatMode } from "@contexts/playback";

import { placeholderTrack } from "@/model/defaults";
import { useVibePlayback } from "@/hooks/useVibePlayback";

export function useShellPlayback() {
  const { t } = useTranslation();
  const playback = useVibePlayback();
  // These are already stable (useVibePlayback binds each to the service), so they
  // travel to the memoized dock/screens as-is — re-wrapping them in another
  // useCallback would only add a second name for the same function.
  const {
    play: playFn,
    togglePlay,
    toggleShuffle,
    toggleRepeat,
    next: playNext,
    prev: playPrev,
  } = playback;

  // Stable identity: the idle track is compared by reference all over the shell.
  const idleTrack = useMemo(() => placeholderTrack(t("player.notPlaying")), [t]);
  const current = playback.current ?? idleTrack;
  const playing = playback.playing;
  const shuffle = playback.shuffle;
  const repeat = playback.repeat !== RepeatMode.OFF;
  const repeatOne = playback.repeat === RepeatMode.ONE;
  const queue = playback.upNext;

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
    toggleShuffle,
    toggleRepeat,
    playNext,
    playPrev,
  };
}
