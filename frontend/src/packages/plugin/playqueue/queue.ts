import {Track} from "../../model/track";

export class Queue {
    private _currentIndex = 0
    private _tracks: Track[] = []

    get current(): Track | undefined {
        return this._tracks[this._currentIndex]
    }

    get tracks(): Track[] {
        return this._tracks
    }

    apply(tracks: Track[], track?: Track): void {
        this.clear()
        this._tracks = [...tracks]
        if (track) {
            this._currentIndex = this._tracks.findIndex((value) => {
                return track.id === value.id
            })
        }
    }

    clear(): void {
        this._tracks = []
        this._currentIndex = 0
    }

    has(track: Track): boolean {
        return this._tracks.findIndex((value) => {
            return value.id === track.id
        }) !== -1
    }

    add(track: Track): void {
        if (this.has(track)) {
            return
        }
        this._tracks.splice(this._currentIndex, 0, track)
    }

    remove(track: Track): void {
        if (!this.has(track)) {
            return
        }
        const delIdx = this._tracks.findIndex((value) => {
            return value.id === track.id
        })
        if (delIdx === this._currentIndex) {
            this.next()
        }
        this._tracks.splice(delIdx, 1)
        if (delIdx <= this._currentIndex) {
            this._currentIndex--
        }

    }

    next(): void {
        if (this._currentIndex === this._tracks.length - 1) {
            this._currentIndex = 0
        } else {
            this._currentIndex++
        }
    }

    previous(): void {
        if (this._currentIndex === 0) {
            this._currentIndex = this._tracks.length - 1
        } else {
            this._currentIndex--
        }
    }

    select(track: Track): void {
        if (!this.has(track)) {
            return
        }
        this._currentIndex = this._tracks.findIndex((value) => {
            return track.id == value.id
        })
    }
}

export default Queue
