import {Track} from "../../../model/track";
import {IQueue, Playmode} from "../../types";
import {AbstractUseableManager} from "../../../manager";
import {AbstractPlugin} from "../abstract-plugin";
import {shuffleArray} from "../../../../shared-utils/math";


class Queue extends AbstractUseableManager<Track> implements IQueue {
    private currentIndex: number

    constructor() {
        super();
        this.currentIndex = -1
    }

    private changeTrack() {
        this.use(this.all()[this.currentIndex].id)
    }

    clear() {
        super.clear();
        this.currentIndex = -1
    }

    use(id: string) {
        super.use(id);
        this.currentIndex = this.all().findIndex(track => {
            return this.current()?.id === track.id
        })
    }


    previous(): void {
        if (this.size === 0) {
            return
        }
        if (this.currentIndex === 0) {
            this.currentIndex = this.size - 1
        } else {
            this.currentIndex--
        }
        this.changeTrack()
    }

    next(): void {
        if (this.size === 0) {
            return
        }
        if (this.currentIndex === this.size - 1) {
            this.currentIndex = 0
        } else {
            this.currentIndex++
        }
        this.changeTrack()
    }
}


export class QueuePlugin extends AbstractPlugin implements IQueue {
    private playmode: Playmode
    private queue: Queue

    constructor() {
        super();
        this.playmode = "sequence"
        this.queue = new Queue()
    }

    private onTrackEnd(): void {
        if (this.playmode === "repeat") {
            this.use(this.current()?.id!)
            return
        }
        if (this.playmode === "sequence") {

        }
        this.next()
    }

    private onPlaymodeChange(playmode: Playmode): void {
        if (playmode === "shuffle") {
            this.apply(shuffleArray(this.all()), this.current())
        }
        this.playmode = playmode
    }

    init(): void {
        throw new Error("Method not implemented.");
    }

    name(): string {
        return this.fullname("queue");
    }

    clear(): void {
        this.queue.clear()
    }

    use(id: string): void {
        this.queue.use(id)
    }

    previous(): void {
        this.queue.previous()
    }

    next(): void {
        this.queue.next()
    }

    apply(ts: Track[], t?: Track | undefined | null): void {
        this.queue.apply(ts, t)
    }

    add(t: Track): void {
        this.queue.add(t)
    }

    remove(id: string): void {
        this.queue.remove(id)
    }

    all(): ReadonlyArray<Readonly<Track>> {
        return this.queue.all()
    }

    get(id: string): Readonly<Track> | null {
        return this.queue.get(id)
    }

    current(): Readonly<Track> | null {
        return this.queue.current()
    }

    has(id: string): boolean {
        return this.queue.has(id)
    }

    get size(): number {
        return this.queue.size
    }

}

export default QueuePlugin
