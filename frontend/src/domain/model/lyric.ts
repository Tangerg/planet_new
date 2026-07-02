import type { FormattedDuration } from "./duration";
import { parseTimestamp } from "@shared/time";

export type Lyric = {
  content: string;
  /** Translated line (e.g. NCM tlyric), when the provider supplies one. */
  translation?: string;
} & FormattedDuration;

/** Matches an LRC timestamp tag. Accepted forms:
 * 1. standard:  [mm:ss.mmm] lyric   e.g. [01:23.456]
 * 2. variant a: [mm:ss] lyric        e.g. [01:23]
 * 3. variant b: [mm:ss:mmm] lyric    (the dot before ms replaced by a colon) e.g. [01:23:456]
 */
const lrcTimestampPattern = /\[(\d{2,}):(\d{2})(?:[.:](\d{1,3}))?]/;

/**
 * Parse a single LRC line into a Lyric.
 * @param lrc - one lyric line
 * @returns the Lyric, or undefined when the line has no valid timestamp
 */
function parseLyric(lrc: string): Lyric | undefined {
  const match = lrcTimestampPattern.exec(lrc);
  if (!match) {
    return undefined;
  }
  const [, minStr, secStr, msStr] = match;
  const duration = parseTimestamp(minStr, secStr, msStr);
  const content = lrc.slice(match[0].length).trim();
  return {
    duration,
    content,
  };
}

/**
 * Parse a multi-line LRC string into an array of Lyric.
 * @param lrcs - the full LRC text
 * @returns the parsed lyric lines (lines without a timestamp are dropped)
 */
export function parseLyrics(lrcs: string): Lyric[] {
  return lrcs
    .split("\n")
    .map(parseLyric)
    .filter((line): line is Lyric => line !== undefined);
}

/**
 * Attach a translated LRC to the main lyric lines, matched by timestamp (the
 * translation shares the original's timings). Lines with no match — or whose
 * translation equals the original — keep `translation` unset.
 */
export function mergeTranslations(lyrics: Lyric[], translated: Lyric[]): Lyric[] {
  if (!translated.length) return lyrics;
  const byTime = new Map(translated.map((l) => [l.duration, l.content]));
  return lyrics.map((l) => {
    const tr = byTime.get(l.duration);
    return tr && tr !== l.content ? { ...l, translation: tr } : l;
  });
}

/**
 * Index of the line active at `positionMs` — the last line whose timestamp is at
 * or before the position. 0 when empty or before the first line (lines are
 * timestamp-ordered; parseLyrics drops untimed lines).
 */
export function activeLyricIndex(lines: readonly Lyric[], positionMs: number): number {
  let idx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].duration <= positionMs) idx = i;
    else break;
  }
  return idx;
}
