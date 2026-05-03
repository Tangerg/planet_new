/**
 * 富时长结构：携带格式化后的字符串。
 * 注意与 `shared-utils/time.ts` 中 `Duration = number` 区分——
 * 后者用于裸毫秒（如 Track.duration / Album.durationCount 字段）。
 */
export type FormattedDuration = {
    duration: number
    durationFormatted?: string
}

export type Progress = FormattedDuration & {
    percent: number
}

export const InfinityDuration: FormattedDuration = {
    duration: Infinity,
    durationFormatted: "--:--:--",
}
