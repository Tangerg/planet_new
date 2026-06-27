import { Plugin } from "../../kernel";
import { getNumberInRange } from "@shared/math";

declare module "../../kernel/event" {
  interface PlanetEventMap {
    change_volume: number;
    mute_or_unmute: never;
    volume_changed: number;
  }
}

export class Volume extends Plugin {
  public static id: string = "volume";
  private preVolume = 0;
  private curVolume = 0;

  get id(): string {
    return Volume.id;
  }

  protected onDispose(): void {
    this.preVolume = 0;
    this.curVolume = 0;
    this.context.hooks.off("change_volume", this.change);
    this.context.hooks.off("mute_or_unmute", this.muteOrUnmute);
  }

  protected onInit(): void {
    this.preVolume = 0;
    // audioElement.volume is 0..1; the public API uses 0..100
    this.curVolume = Math.round(this.context.audioElement.volume * 100);

    this.context.hooks.on("change_volume", this.change, this);
    this.context.hooks.on("mute_or_unmute", this.muteOrUnmute, this);

    this.context.hooks.emit("volume_changed", this.curVolume);
  }

  private async change(v: number): Promise<void> {
    v = getNumberInRange(0, 100, v);
    if (this.curVolume === v) {
      return;
    }
    this.preVolume = this.curVolume;
    this.context.audioElement.volume = v / 100;
    this.curVolume = v;
    this.context.hooks.emit("volume_changed", this.curVolume);
  }

  private async muteOrUnmute(): Promise<void> {
    let v = 0;
    if (this.curVolume === 0) {
      if (this.preVolume === 0) {
        v = 30;
      } else {
        v = this.preVolume;
      }
    } else {
      v = 0;
    }
    await this.change(v);
  }
}
