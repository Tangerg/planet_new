import { Plugin } from "../../kernel";
import { Track } from "@domain/model/track";

export enum PlayState {
  PLAYING = "playing",
  PAUSED = "paused",
  STOPPED = "stopped",
}

declare module "../../kernel/event" {
  interface PlanetEventMap {
    play_state_changed: PlayState;
    play_track_ended: never;
  }
}

/**
 * Drives the shared <audio> element. Transport commands (resume/pause) arrive as
 * direct method calls from PlaybackService. It reacts to the internal
 * `current_track_changed` fact by loading + playing the new track, and turns the
 * element's native `ended` into the `play_track_ended` choreography event the
 * queue plugin auto-advances on.
 */
export class Control extends Plugin {
  public static readonly id = "control";

  get id(): string {
    return Control.id;
  }

  protected onInit(): void {
    this.context.audioElement.addEventListener("ended", this.onPlayEnd);
    this.context.hooks.on("current_track_changed", this.changePlayTrack, this);
  }

  protected onDispose(): void {
    this.stop();
    this.context.audioElement.removeEventListener("ended", this.onPlayEnd);
    this.context.hooks.off("current_track_changed", this.changePlayTrack);
  }

  async resume(): Promise<void> {
    await this.context.audioElement.play();
    this.context.hooks.emit("play_state_changed", PlayState.PLAYING);
  }

  pause(): void {
    this.context.audioElement.pause();
    this.context.hooks.emit("play_state_changed", PlayState.PAUSED);
  }

  stop(): void {
    this.context.audioElement.pause();
    this.context.audioElement.src = "";
    this.context.hooks.emit("play_state_changed", PlayState.STOPPED);
  }

  private onPlayEnd = (): void => {
    this.context.hooks.emit("play_track_ended");
  };

  private changePlayTrack = async (track: Track | undefined): Promise<void> => {
    // No playable URL (cleared queue, mock provider, or a Spotify track with no
    // preview): stop and bail — the track metadata was already broadcast.
    if (!track?.playUrl) {
      this.stop();
      return;
    }
    this.context.audioElement.src = track.playUrl;
    await this.resume();
  };
}
