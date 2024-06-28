import {Plugin} from "../../core";
import {Timer, sleep} from "../../shared-utils/time";

export type LyricModel = {
    duration: number
    content: string
}

class LyricIterator {
    private static startIndex = -1
    private currentIndex: number = LyricIterator.startIndex
    private dataSource: LyricModel[] = []

    apply(dataSource: LyricModel[]): void {
        this.clear()
        this.dataSource = dataSource
    }

    clear(): void {
        this.currentIndex = LyricIterator.startIndex
        this.dataSource = []
    }

    hasNext(): boolean {
        return this.currentIndex < this.dataSource.length - 1
    }

    current(): LyricModel | undefined {
        return this.dataSource[this.currentIndex]
    }

    next(): LyricModel | undefined {
        this.currentIndex++
        return this.current()
    }

    jumpTo(index: number): void {
        if (index >= 0 && index < this.dataSource.length - 1) {
            this.currentIndex = index;
        } else {
            this.currentIndex = this.dataSource.length
        }
    }

    findIndex(predicate: (item: LyricModel, index: number, dataSource: LyricModel[]) => boolean): number {
        return this.dataSource.findIndex(predicate)
    }
}

class LyricTimer extends Timer {
    private offset: number = 0

    get duration(): number {
        return super.duration + this.offset
    }

    seek(t: number): void {
        this.offset = t
        const now = Date.now()
        this.pausedDuration = 0
        this.startAt = now
        this.lastPauseAt = now
    }
}

class Lyric extends Plugin {
    private state: "running" | "suspended" = "suspended"
    private lyricIterator: LyricIterator
    private lyricTimer: LyricTimer
    public static id: string = 'lyric';

    constructor() {
        super();
        this.lyricIterator = new LyricIterator()
        this.lyricTimer = new LyricTimer()
    }

    get id(): string {
        return Lyric.id;
    }

    dispose(): void {
        this.state = "suspended"
        this.lyricIterator.clear()
        this.lyricTimer.reset()
    }

    private get sleepDuration(): number {
        const lyric = this.lyricIterator.current()
        if (!lyric) {
            return 0
        }
        return lyric.duration - this.lyricTimer.duration
    }

    private apply(lyrics: LyricModel[]) {
        this.dispose()
        this.lyricIterator.apply(lyrics)
        this.lyricTimer.reset()
    }

    private async keepPlay(): Promise<void> {
        while (this.state === "running" && this.lyricIterator.hasNext()) {
            this.lyricIterator.next();
            await sleep(this.sleepDuration);
        }
    }

    private play() {
        if (this.state === "running") {
            return
        }
        this.state = "running"
        this.lyricTimer.run()
        this.keepPlay()
    }

    private pause() {
        if (this.state === "suspended") {
            return
        }
        this.lyricTimer.pause()
        this.state = "suspended"
    }

    private seek(t: number) {
        this.lyricTimer.seek(t)
        const index = this.lyricIterator.findIndex((item) => {
            return this.lyricTimer.duration <= item.duration
        })
        this.lyricIterator.jumpTo(index)
    }
}
