import { Plugin } from "../../kernel";
import { Volume as VolumeModel } from "@domain/model/volume";

declare module "../../kernel/event" {
  interface PlanetEventMap {
    volume_changed: number;
  }
}

/**
 * Owns the volume value object and mirrors it onto the <audio> element.
 * Commands (setVolume/toggleMute) are direct method calls from PlaybackService;
 * the resulting level is broadcast as `volume_changed`. The value object holds
 * the mute/restore rule, so this plugin stays a thin mirror.
 */
export class Volume extends Plugin {
  public static readonly id = "volume";
  // audioElement.volume is 0..1; the value object works on the 0..100 scale.
  private volume = VolumeModel.of(0);

  get id(): string {
    return Volume.id;
  }

  protected onInit(): void {
    this.volume = VolumeModel.of(Math.round(this.context.audioElement.volume * 100));
    // The element defaults to full volume but doesn't broadcast it; seed the UI.
    this.emit();
  }

  setVolume(level: number): void {
    const next = this.volume.set(level);
    if (next.level === this.volume.level) return;
    this.apply(next);
  }

  toggleMute(): void {
    this.apply(this.volume.toggleMute());
  }

  private apply(next: VolumeModel): void {
    this.volume = next;
    this.context.audioElement.volume = next.level / 100;
    this.emit();
  }

  private emit(): void {
    this.context.hooks.emit("volume_changed", this.volume.level);
  }
}
