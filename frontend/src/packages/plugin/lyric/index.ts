import {Plugin} from "../../core";

export type LyricModel = {
    duration: number
    content: string
}


class Lyric extends Plugin {
    private timer: number = 0
    private state: "running" | "suspended" = "suspended"
    private currentIndex: number = 0
    private lyrics: LyricModel[] = []
    private lastSeekDuration: number = 0
    private lastPlayAt: number = 0

    public static id: string = 'lyric';

    get id(): string {
        return Lyric.id;
    }

    dispose(): void {
        this.state = "suspended"
        clearTimeout(this.timer)
        this.timer = 0
        this.currentIndex = 0
        this.lyrics = []
    }

    private next(): boolean {
        if (this.lyrics.length === 0) {
            return false
        }
        return this.currentIndex >= this.lyrics.length - 1;
    }

    private get sleepDuration(): number {
        if (!this.next()) {
            return 0
        }
        return this.lyrics[this.currentIndex].duration - (new Date().getTime() - this.lastPlayAt) - this.lastSeekDuration
    }

    private apply(lyrics: LyricModel[]) {
        this.dispose()
        this.lyrics = lyrics
    }

    private async keepPlay(): Promise<void> {
        clearTimeout(this.timer)
        if (!this.next()) {
            return
        }
        this.timer = setTimeout(() => {
            this.currentIndex++
            this.keepPlay()
        }, this.sleepDuration) as unknown as number
    }

    private resetCurrentIndex() {
        for (let i = 0; i < this.lyrics.length; i++) {
            if (this.lastSeekDuration <= this.lyrics[i].duration) {
                this.currentIndex = i
                return
            }
        }
        this.currentIndex = this.lyrics.length
    }

    private play() {
        if (this.state === "running") {
            return
        }
        this.resetCurrentIndex()
        this.keepPlay()
        this.state = "running"
    }

    private pause() {
        if (this.state === "suspended") {
            return
        }
        this.state = "suspended"
    }

    private seek(t: number) {

    }
}
