import {Plugin} from "../plugin";
import {Track} from "../../../model/track";


class PlaylistContext {
    sequenceTracks: Track[] = []
    playTracks: Track[] = []
    currentPlayTrack: Track | null = null
    private currentPlayTrackIndex: number = 0

    nextTrack() {
        if (this.currentPlayTrackIndex == this.playTracks.length - 1) {
            this.currentPlayTrackIndex = 0
        } else {
            this.currentPlayTrackIndex++
        }
        this.currentPlayTrack = this.playTracks[this.currentPlayTrackIndex]
    }

    prevTrack() {
        if (this.currentPlayTrackIndex == 0) {
            this.currentPlayTrackIndex = this.playTracks.length - 1
        } else {
            this.currentPlayTrackIndex--
        }
        this.currentPlayTrack = this.playTracks[this.currentPlayTrackIndex]
    }

    hasTrack(track: Track): boolean {
        return this.playTracks.some((t) => {
            return t.id == track.id
        })
    }

    isCurrentPlayTrack(t: Track): boolean {
        return t.id === this.currentPlayTrack?.id
    }

    addTrack(track: Track) {
        this.playTracks.splice(this.currentPlayTrackIndex + 1, 0, track)
        const sequenceTrackIndex = this.sequenceTracks.findIndex((t) => {
            return this.currentPlayTrack && t.id == this.currentPlayTrack.id
        })
        this.sequenceTracks.splice(sequenceTrackIndex, 0, track)
    }

    resetCurrentPlayIndex() {
        this.currentPlayTrackIndex = this.playTracks.findIndex((t) => {
            return this.currentPlayTrack && this.currentPlayTrack.id == t.id
        })
    }

    removeTrack(track: Track) {
        const removePlayTrackIndex = this.playTracks.findIndex((t) => {
            return track.id == t.id
        })
        this.playTracks.splice(removePlayTrackIndex, 1)
        const removeSequenceTrackIndex = this.sequenceTracks.findIndex((t) => {
            return track.id == t.id
        })
        this.sequenceTracks.splice(removeSequenceTrackIndex, 1)
        this.resetCurrentPlayIndex()
    }

    reset() {
        this.sequenceTracks = []
        this.playTracks = []
        this.currentPlayTrackIndex = 0
        this.currentPlayTrack = null
    }
}

export class Playlist extends Plugin {
    private ctx: PlaylistContext

    constructor() {
        super();
        this.ctx = new PlaylistContext()
    }

    name(): string {
        return this.fullname("playlist")
    }

    init(): void {
        throw new Error("Method not implemented.");
    }

    private reset() {
        this.ctx.reset()
    }

    clear() {
        this.reset()
    }

    apply(tracks: Track[], track: Track): void {
        this.clear()
        this.ctx.sequenceTracks = tracks
        this.ctx.playTracks = tracks
        this.ctx.currentPlayTrack = this.ctx.hasTrack(track) ? track : this.ctx.playTracks[0]
        this.ctx.resetCurrentPlayIndex()
    }

    next() {
        this.ctx.nextTrack()
    }

    prev(): void {
        this.ctx.prevTrack()
    }

    add(t: Track): void {
        this.addToNext(t)
        this.next()
    }

    addToNext(t: Track): void {
        if (this.ctx.hasTrack(t)) {
            return
        }
        this.ctx.addTrack(t)
    }

    remove(t: Track): void {
        if (!this.ctx.hasTrack(t)) {
            return;
        }
        if (this.ctx.playTracks.length === 1) {
            this.clear()
            return;
        }
        if (this.ctx.isCurrentPlayTrack(t)) {
            this.next()
        }
        this.ctx.removeTrack(t)
    }

    select(t: Track): void {
        if (this.ctx.isCurrentPlayTrack(t)) {
            return
        }
        if (!this.ctx.hasTrack(t)) {
            return;
        }
        this.ctx.currentPlayTrack = t
        this.ctx.resetCurrentPlayIndex()
    }
}

export default Playlist
