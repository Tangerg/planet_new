import { useMemo } from "react";
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
    next: playNext,
    prev: playPrev,
  } = playback;

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
