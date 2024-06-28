export type Duration = {
    duration: number
    durationFormatted?: string
}

export type Progress  = Duration & {
    percent:number
}

export const InfinityDuration :Duration = {
    duration: Infinity,
    durationFormatted: "--:--:--"
}