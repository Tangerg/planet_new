import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { activeLyricIndex, type Lyric } from "@contexts/playback";

import { usePlaybackProgress } from "@/hooks/usePlaybackProgress";
import { lyricLinesOrFallback } from "@/model/now-playing";
import { LyricLines } from "@/components/now-playing/LyricLines";

type Props = {
  lyrics: readonly Lyric[];
};

export function LyricsPanel({ lyrics }: Props) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { positionSec } = usePlaybackProgress();
  const noLyricsText = t("player.noLyrics");
  const lines = useMemo(() => lyricLinesOrFallback(lyrics, noLyricsText), [lyrics, noLyricsText]);
  const active = useMemo(() => activeLyricIndex(lines, positionSec * 1000), [lines, positionSec]);

  return (
    <div ref={scrollRef} className="scroll h-full">
      <LyricLines lines={lines} active={active} scrollRef={scrollRef} />
    </div>
  );
}
