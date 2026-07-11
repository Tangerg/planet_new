import type { AudioRuntimePort } from "@core";

/** Browser implementation of the kernel's audio resource port. */
export class WebAudioRuntime implements AudioRuntimePort {
  readonly audioElement: HTMLAudioElement;
  readonly audioContext: AudioContext;
  private disposed = false;

  constructor() {
    this.audioElement = new Audio();
    this.audioContext = new AudioContext();
  }

  createAnalysisElement(): HTMLAudioElement {
    if (this.disposed) throw new Error("audio runtime is disposed");
    return new Audio();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.audioElement.pause();
    this.audioElement.removeAttribute("src");
    this.audioElement.load();
    void this.audioContext.close().catch(() => undefined);
  }
}
