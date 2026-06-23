import {FormattedDuration} from "./duration";
import {parseTimestamp} from "@shared/time";

export type Lyric = {
    content: string
} & FormattedDuration

/** Matches an LRC timestamp tag. Accepted forms:
 * 1. standard:  [mm:ss.mmm] lyric   e.g. [01:23.456]
 * 2. variant a: [mm:ss] lyric        e.g. [01:23]
 * 3. variant b: [mm:ss:mmm] lyric    (the dot before ms replaced by a colon) e.g. [01:23:456]
 */
const lyricDurationReg = /\[(\d{2,}):(\d{2})(?:[.:](\d{1,3}))?]/;


/**
 * Parse a single LRC line into a Lyric.
 * @param lrc - one lyric line
 * @returns the Lyric, or undefined when the line has no valid timestamp
 */
function parseLyric(lrc: string): Lyric | undefined {
    const execArr = lyricDurationReg.exec(lrc)
    if (!execArr) {
        return undefined
    }
    const [, minStr, secStr, msStr] = execArr;
    const duration = parseTimestamp(minStr, secStr, msStr);
    const content = lrc.slice(execArr[0].length).trim();
    return {
        duration,
        content
    }
}


/**
 * Parse a multi-line LRC string into an array of Lyric.
 * @param lrcs - the full LRC text
 * @returns the parsed lyric lines
 */
export function parseLyrics(lrcs: string): Lyric[] {
    return lrcs
        .split("\n")
        .map(parseLyric)
        .filter(Boolean) as Lyric[]
}
