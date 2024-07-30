import {Track} from "../../model/track";
import {EventEmitter, IEventMap} from "../../event";

export interface QueueEventMap extends IEventMap {
    current_track_changed: Track | undefined;
    tracks_changed: Track[];
    tracks_cleaned: never;
}

export class Queue extends EventEmitter<QueueEventMap> {
    private _currentIndex = -1
    private _tracks: Track[] = []

    get current(): Track | undefined {
        return this._tracks[this._currentIndex]
    }

    get tracks(): Track[] {
        return this._tracks
    }

    get size(): number {
        return this._tracks.length
    }

    apply(tracks: Track[]): void {
        this.clear()
        this._tracks = [...tracks]
        this.emit("tracks_changed", this._tracks)
    }

    clear(): void {
        this._tracks = []
        this._currentIndex = -1
        this.emit("tracks_cleaned")
    }


    currentIsLast(): boolean {
        return this._currentIndex === this.size - 1
    }

    findIndex(track: Track): number {
        return this._tracks.findIndex(value => track.id === value.id)
    }

    has(track: Track): boolean {
        return this.findIndex(track) !== -1
    }

    add(track: Track): void {
        if (this.has(track)) {
            return
        }
        this._tracks.splice(this._currentIndex + 1, 0, track)
        this.emit("tracks_changed", this._tracks)
    }

    remove(track: Track): void {
        if (!this.size) {
            return
        }
        if (this.size === 1) {
            this.clear()
            return
        }

        const delIndex = this.findIndex(track)
        if (delIndex === -1) {
            return
        }
        if (delIndex === this._currentIndex) {
            this.next()
        }
        this._tracks.splice(delIndex, 1)
        if (delIndex <= this._currentIndex) {
            this._currentIndex--
        }
        this.emit("tracks_changed", this._tracks)
    }

    next(): void {
        if (!this.size) {
            return
        }
        this._currentIndex = (this._currentIndex + 1) % this.size
        this.emit("current_track_changed", this.current)
    }

    previous(): void {
        if (!this.size) {
            return
        }
        this._currentIndex = (this._currentIndex - 1 + this.size) % this.size
        this.emit("current_track_changed", this.current)
    }

    select(track: Track): void {
        const index = this.findIndex(track)
        if (index !== -1) {
            this._currentIndex = index
            return
        }
        this.emit("current_track_changed", this.current)
    }
}

export default Queue
