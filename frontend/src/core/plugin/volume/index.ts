import { definePlugin, service } from "dougong";
import { Volume } from "@domain/model/volume";
import { AUDIO_RUNTIME, broadcaster, VOLUME_CHANGED, type Broadcast } from "../../kernel";

/** Volume control: setVolume / toggleMute. */
export const VOLUME_CONTROL = service<VolumeRuntime>("planet/volume");

/**
 * Owns the volume value object and mirrors it onto the <audio> element.
 * Commands (setVolume/toggleMute) are direct method calls from PlaybackService;
 * the resulting level is broadcast. The value object holds the mute/restore
 * rule, so this runtime stays a thin mirror.
 */
export class VolumeRuntime {
  // audioElement.volume is 0..1; the value object works on the 0..100 scale.
  private volume: Volume;

  constructor(
    private readonly audioElement: HTMLAudioElement,
    private readonly broadcast: Broadcast,
  ) {
    this.volume = Volume.of(Math.round(audioElement.volume * 100));
  }

  setVolume(level: number): void {
    const next = this.volume.set(level);
    if (next.level === this.volume.level) return;
    this.apply(next);
  }

  toggleMute(): void {
    this.apply(this.volume.toggleMute());
  }

  /** Current output level, 0..100. The initial value is read, never broadcast. */
  get level(): number {
    return this.volume.level;
  }

  private apply(next: Volume): void {
    this.volume = next;
    this.audioElement.volume = next.level / 100;
    this.broadcast(VOLUME_CHANGED, next.level);
  }
}

export const volumePlugin = definePlugin({
  name: "planet.volume",
  requires: { audio: AUDIO_RUNTIME },
  provides: { volume: VOLUME_CONTROL },
  setup(ctx) {
    return { volume: new VolumeRuntime(ctx.audio.audioElement, broadcaster(ctx)) };
  },
});
