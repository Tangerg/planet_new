// ============================================================
// LyricsPanel — the Now Playing lyric-reading subtree, together with the
// progress subscription that drives it.
//
// Subscribing to the frequent playback tick HERE (not in useNowPlayingModel)
// keeps the rest of Now Playing — full-bleed cover, rotating disc, marquees,
// comments, up-next sheet — off the per-tick re-render path. Now Playing has no
// scrubber, so the active lyric line is the only thing the clock moves, and it
// advances every few seconds, not several times a second. LyricLines is memoized,
// so the tick only re-lays the list when the active line actually changes.
// ============================================================
import { useMemo, useRef } from "react";

import { activeLyricIndex, type Lyric } from "@domain/model/lyric";

import { usePlaybackProgress } from "@/hooks/usePlaybackProgress";
import { lyricLinesOrFallback } from "@/model/now-playing";
import { LyricLines } from "@/components/now-playing/LyricLines";

type Props = {
  lyrics: readonly Lyric[];
  noLyricsText?: string;
  accent: string;
};

export function LyricsPanel({ lyrics, noLyricsText, accent }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { positionSec } = usePlaybackProgress();
  const lines = useMemo(() => lyricLinesOrFallback(lyrics, noLyricsText), [lyrics, noLyricsText]);
  // Recomputed each tick, but the value is stable between line changes — so the
  // memoized LyricLines below bails until the active line actually advances.
  const active = useMemo(() => activeLyricIndex(lines, positionSec * 1000), [lines, positionSec]);

  return (
    <div ref={scrollRef} className="scroll h-full">
      <LyricLines lines={lines} accent={accent} active={active} scrollRef={scrollRef} />
    </div>
  );
}
