export type Duration = number

export const Millisecond: Duration = 1
export const Second: Duration = 1000 * Millisecond
export const Minute: Duration = 60 * Second
export const Hour: Duration = 60 * Minute

export function sleep(duration: Duration): Promise<void> {
    if (!Number.isFinite(duration) || duration < 0) {
        duration = 0;
    }
    return new Promise<void>(resolve => {
        setTimeout(resolve, duration);
    });
}

export class Timer {
    protected state: "running" | "suspended" = "suspended"
    protected startAt: number = 0
    protected lastPauseAt: number = 0
    protected pausedDuration: Duration = 0

    get isRunning(): boolean {
        return this.state === "running";
    }

    get duration(): Duration {
        const endAt = this.isRunning ? Date.now() : this.lastPauseAt
        return endAt - this.startAt - this.pausedDuration;
    }

    run(): void {
        if (this.isRunning) {
            return
        }
        const now = Date.now()
        if (this.startAt === 0) {
            this.startAt = now
        }
        if (this.lastPauseAt !== 0) {
            this.pausedDuration += (now - this.lastPauseAt)
        }
        this.state = "running"
    }

    pause(): void {
        if (!this.isRunning) {
            return
        }
        this.lastPauseAt = Date.now()
        this.state = "suspended"
    }

    reset(): void {
        this.state = "suspended"
        this.startAt = 0
        this.lastPauseAt = 0
        this.pausedDuration = 0
    }
}

/**
 * 格式化时间长度
 * @param duration 需要被格式化的时间长度，以毫秒为单位, 向下取整
 * @param units 需要被格式化的梯度,只能传入Hour,Minute,Second
 * @return 返回 “[units[0]]:[units[1]]:[units[2]]” 的格式,返回的格式化长度和传入的uints有关
 */
export function formatDuration(duration: Duration, units: Duration[]): string {
    duration = Math.max(duration, 0);
    return units.map(uint => {
        const time = Math.floor(duration / uint).toString().padStart(2, "0")
        duration %= uint
        return time
    }).join(":");
}

/**
 * 格式化毫秒级别时间长度
 * @param duration 需要被格式化的时间长度，以毫秒为单位, 向下取整
 * @return 返回 “00:00:00” 的格式
 */
export function formatDurationMillisecond(duration: Duration): string {
    const units = [Hour, Minute, Second];
    return formatDuration(duration, units)
}

/**
 * 格式化秒级别时间长度
 * @param seconds 需要被格式化的时间长度，以秒为单位, 向下取整
 * @return 返回 “00:00:00” 的格式
 */
export function formatDurationSeconds(seconds: number): string {
    return formatDurationMillisecond(seconds * Second)
}

/**
 * 解析时间戳字符串并返回时间（以毫秒为单位）。
 * @param minStr - 时间戳中的分钟部分
 * @param secStr - 时间戳中的秒部分
 * @param msStr - 可选的毫秒部分
 * @returns 以毫秒表示的时间
 */
export function parseTimestamp(minStr: string, secStr: string, msStr?: string): Duration {
    const min = parseInt(minStr, 10);
    const sec = parseInt(secStr, 10);
    const ms = msStr ? parseInt(msStr, 10) : 0;
    return min * Minute + sec * Second + ms * Millisecond;
}
