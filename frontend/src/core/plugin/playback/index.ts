import { Plugin, defineCapability } from "../../kernel";
import { Track } from "@domain/model/track";

export enum PlayState {
  PLAYING = "playing",
  PAUSED = "paused",
  STOPPED = "stopped",
}

declare module "../../kernel/event" {
  interface PlanetEventMap {
    "playback:state-changed": PlayState;
    "playback:track-ended": never;
  }
}

/** Audio transport (resume/pause/stop). */
export const TRANSPORT = defineCapability<Playback>("transport");

/**
 * Drives the shared <audio> element. Transport commands (resume/pause) arrive as
 * direct method calls from PlaybackService. It reacts to the internal
 * `queue:current-changed` fact by loading + playing the new track, and turns the
 * element's native `ended` into the `playback:track-ended` choreography event
 * the queue plugin auto-advances on.
 */
export class Playback extends Plugin {
  public static readonly id = "playback";

  get id(): string {
    return Playback.id;
  }

  protected onInit(): void {
    this.context.registry.provide(TRANSPORT, this);
    this.context.audioElement.addEventListener("ended", this.onEnded);
    this.context.hooks.on("queue:current-changed", this.onCurrentChanged, this);
  }

  protected onDispose(): void {
    this.stop();
    this.context.audioElement.removeEventListener("ended", this.onEnded);
    this.context.hooks.off("queue:current-changed", this.onCurrentChanged);
  }

  async resume(): Promise<void> {
    await this.context.audioElement.play();
    this.context.hooks.emit("playback:state-changed", PlayState.PLAYING);
  }

  pause(): void {
    this.context.audioElement.pause();
    this.context.hooks.emit("playback:state-changed", PlayState.PAUSED);
  }

  stop(): void {
    this.context.audioElement.pause();
    this.context.audioElement.src = "";
    this.context.hooks.emit("playback:state-changed", PlayState.STOPPED);
  }

  private onEnded = (): void => {
    this.context.hooks.emit("playback:track-ended");
  };

  private onCurrentChanged = async (track: Track | undefined): Promise<void> => {
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
