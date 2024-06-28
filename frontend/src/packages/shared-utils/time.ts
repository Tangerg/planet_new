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
