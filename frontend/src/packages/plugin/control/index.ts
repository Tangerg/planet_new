import {Plugin} from "../../core";
import {Track} from "../../model/track";

export enum PlayState {
    PLAYING = "playing",
    PAUSED = "paused",
    STOPED = "stoped",
}

declare module "../../core/event" {
    interface PlanetEventMap {
        play: never
        pause: never
        play_state_changed: PlayState
        play_track_ended: never
    }
}

export class Control extends Plugin {
    public static id: string = "control";

    get id(): string {
        return Control.id;
    }

    dispose(): void {
        this.stop()
        this.context.audioElement.removeEventListener("ended", this.onPlayEnd)
        this.context.hooks.off("play", this.play)
        this.context.hooks.off("pause", this.pause)
        this.context.hooks.off("current_track_changed", this.changePlayTrack)
    }

    protected onInit(): void {
        this.context.audioElement.addEventListener("ended", this.onPlayEnd)
        this.context.hooks.on("play", this.play, this)
        this.context.hooks.on("pause", this.pause, this)
        this.context.hooks.on("current_track_changed", this.changePlayTrack, this)
    }

    play = async (): Promise<void> => {
        await this.context.audioElement.play()
        this.context.hooks.emit("play_state_changed", PlayState.PLAYING)
    }

    onPlayEnd = (): void => {
        this.context.hooks.emit("play_track_ended")
    }

    pause = (): void => {
        this.context.audioElement.pause()
        this.context.hooks.emit("play_state_changed", PlayState.PAUSED)
    }

    stop = (): void => {
        this.pause()
        this.context.audioElement.src = ""
        this.context.hooks.emit("play_state_changed", PlayState.STOPED)
    }

    changePlayTrack = async (track: Track): Promise<void> => {
        this.stop()
        if (!track.playUrl) {
            // 无可播放 URL（Mock provider 或 Spotify 没 preview 的曲目）
            // 仍然 emit 状态以便 UI 更新当前曲目元数据
            return
        }
        this.context.audioElement.src = track.playUrl
        await this.play()
    }
}

export default Control
