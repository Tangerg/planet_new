import {Plugin} from "../../core";
import {Mode as Playmode} from "../playmode";
import Queue from "./queue";
import {Track} from "../../model/track";
import {shuffleArray} from "../../shared-utils/array";

export class PlayQueue extends Plugin {
    public static id: string = "playqueue"
    private playMode: Playmode = Playmode.Sequence
    private readonly playQueue: Queue
    private readonly displayQueue: Queue

    constructor() {
        super();
        this.displayQueue = new Queue()
        this.playQueue = new Queue()
    }

    get id(): string {
        return PlayQueue.id
    }

    dispose(): void {
        this.clear()
    }

    clear(): void {
        this.playQueue.clear()
        this.displayQueue.clear()
    }

    apply(tracks: Track[], track?: Track): void {
        let playTracks: Track[] = []
        const playTrack: Track = track ? track : tracks[0]
        if (this.playMode === Playmode.Repeat) {
            playTracks = [playTrack]
        } else if (this.playMode === Playmode.Shuffle) {
            playTracks = [...shuffleArray(tracks)]
        }
        this.displayQueue.apply(tracks, playTrack)
        this.playQueue.apply(playTracks, playTrack)
    }
}

