import { Track } from "../../../packages/model/track";
import { PlayState } from "../../../packages/plugin";
import type {
    FormattedDuration,
    Progress,
} from "../../../packages/model/duration";

export interface State {
    key: string;
    tracks: readonly Track[];
    track: Track | undefined;
    playState: PlayState;
    /** 当前曲目总时长（秒） + 已格式化字符串 */
    duration: FormattedDuration;
    /** 当前播放进度（含 percent / 已格式化字符串） */
    progress: Progress;
}

export const initState: State = {
    key: "",
    tracks: [],
    track: undefined,
    playState: PlayState.STOPED,
    duration: { duration: 0, durationFormatted: "00:00" },
    progress: { duration: 0, durationFormatted: "00:00", percent: 0 },
};
