export function sleep(duration: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(resolve, duration);
    });
}

export class Timer {
    protected state: "running" | "suspended" = "suspended"
    protected startAt: number = 0
    protected lastPauseAt: number = 0
    protected pausedDuration: number = 0

    get isRunning(): boolean {
        return this.state === "running";
    }

    get duration(): number {
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


export type Duration = number

export const Millisecond = 1
export const Second :Duration = 1000 * Millisecond
export const Minute :Duration = 60 * Second
export const Hour :Duration = 60 * Minute

/**
 * 格式化时间长度
 * @param duration 需要被格式化的时间长度，向下取整
 * @return 返回 “00:00:00” 的格式
 */
export function formatDuration(duration: Duration): string {
    duration = Math.max(duration, 0);
    const uints = [Hour, Minute, Second];
    return uints.map(uint=>{
        const time =  Math.floor(duration / uint).toString().padStart(2,"0")
        duration %=uint
        return time
    }).join(":");
}
/**
 * 格式化秒级别时间长度
 * @param seconds 需要被格式化的时间长度，以秒为单位,向下取整
 * @return 返回 “00:00:00” 的格式
 */
export function formatDurationSeconds(seconds :number):string {
    return formatDuration(seconds * Second)
}