import {FormattedDuration} from "./duration";
import {parseTimestamp} from "../shared-utils/time";

export type Lyric = {
    content: string
} & FormattedDuration

/**  lyricDurationReg
 * 1、标准格式： [分钟:秒.毫秒] 歌词  [01:23.456]
 * 2、其他格式①：[分钟:秒] 歌词 [01:23]
 * 3、其他格式②：[分钟:秒:毫秒] 歌词 与标准格式相比，秒后边的点号被改成了冒号 [01:23:456]
 * */
const lyricDurationReg = /\[(\d{2,}):(\d{2})(?:[.:](\d{1,3}))?]/;


/**
 * 将单行歌词解析为一个 Lyric 对象。
 * @param lrc - 单行歌词
 * @returns 歌词对象，如果格式不正确则返回 undefined
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
 * 格式化多行歌词字符串为歌词对象数组。
 * @param lrcs - 多行歌词字符串
 * @returns 格式化后的歌词对象数组
 */
export function parseLyrics(lrcs: string): Lyric[] {
    return lrcs
        .split("\n")
        .map(parseLyric)
        .filter(Boolean) as Lyric[]
}
