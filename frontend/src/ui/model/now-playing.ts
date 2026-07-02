import type { Lyric } from "@domain/model/lyric";

const NO_LYRICS: Lyric = { content: "No lyrics for this track.", duration: 0 };

/** The lyric lines to render, or a single "no lyrics" line when there are none. */
export function lyricLinesOrFallback(lines: readonly Lyric[]): Lyric[] {
  return lines.length ? [...lines] : [NO_LYRICS];
}
