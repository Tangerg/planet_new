import {Plugin} from "../plugin";
import {Lyric as LyricModel} from "../../model/lyric";

class LyricContext {
    readonly lyric: Lyric
    readonly playState: LyricPlayState
    readonly pauseState: LyricPlayState
    readonly stopState: LyricPlayState

    private lyrics: LyricModel[] = []
    private currentIndex: number = 0
    private timerID: number = 0
    latestPlayAt: number = 0
    latestSeekTime: number = 0

    constructor(l: Lyric) {
        this.lyric = l
        this.playState = new LyricPlayStatePlay(this)
        this.pauseState = new LyricPlayStatePause(this)
        this.stopState = new LyricPlayStateStop(this)
    }

    private reset() {
        this.lyrics = []
        this.currentIndex = 0
        this.clearTimer()
        this.latestPlayAt = 0
        this.latestSeekTime = 0
    }


    private clearTimer() {
        if (this.timerID) {
            clearTimeout(this.timerID)
            this.timerID = 0
        }
    }

    apply(lyrics: LyricModel[]) {
        this.reset()
        this.lyrics = lyrics
    }

    keepPlay() {
        this.clearTimer()
        if (this.currentIndex == this.lyrics.length) {
            return
        }
        const delay = this.lyrics[this.currentIndex].time - (new Date().getTime() - this.latestPlayAt) - this.latestSeekTime
        this.timerID = setTimeout(() => {
            if (this.currentIndex < this.lyrics.length) {
                this.currentIndex++
                this.keepPlay()
            }
        }, delay)
    }

    resetCurrentIndex() {
        for (let i = 0; i < this.lyrics.length; i++) {
            if (this.latestSeekTime <= this.lyrics[i].time) {
                this.currentIndex = i
                return
            }
        }
        this.currentIndex = this.lyrics.length
    }
}

abstract class LyricPlayState {
    protected ctx: LyricContext

    public constructor(ctx: LyricContext) {
        this.ctx = ctx
    }

    pause(): void {
    }

    play(): void {
    }

    seek(t: number) {
        this.ctx.latestSeekTime = t
        this.ctx.resetCurrentIndex()
    }
}

class LyricPlayStatePlay extends LyricPlayState {
    pause() {
        const playedTime = new Date().getTime() - this.ctx.latestPlayAt
        this.ctx.latestSeekTime = this.ctx.latestSeekTime + playedTime
        this.ctx.lyric.changePlayState(this.ctx.pauseState)
    }

    seek(t: number) {
        super.seek(t);
        this.ctx.keepPlay()
    }
}

class LyricPlayStatePause extends LyricPlayState {
    play() {
        this.ctx.latestPlayAt = new Date().getTime()
        this.ctx.resetCurrentIndex()
        this.ctx.keepPlay()
        this.ctx.lyric.changePlayState(this.ctx.playState)
    }
}

class LyricPlayStateStop extends LyricPlayState {
    play() {
        this.ctx.latestPlayAt = new Date().getTime()
        this.ctx.resetCurrentIndex()
        this.ctx.keepPlay()
        this.ctx.lyric.changePlayState(this.ctx.playState)
    }
}

export class Lyric extends Plugin {
    private readonly ctx: LyricContext
    private currentPlayState!: LyricPlayState

    constructor() {
        super();
        this.ctx = new LyricContext(this)
        this.changePlayState(this.ctx.stopState)
    }

    name(): string {
        return this.fullname("lyric")
    }


    init(): void {
    }

    apply(lyrics: LyricModel[]): void {
        this.ctx.apply(lyrics)
        this.changePlayState(this.ctx.stopState)
    }

    play(): void {
        this.currentPlayState.play()
    }

    pause(): void {
        this.currentPlayState.pause()
    }

    seek(t: number): void {
        this.currentPlayState.seek(t)
    }

    changePlayState(state: LyricPlayState): void {
        this.currentPlayState = state
    }
}

export default Lyric
