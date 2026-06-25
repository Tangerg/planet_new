import type { IPlanet, IPlugin } from "../kernel";
import { type IProvider, PROVIDER_PLUGIN_ID } from "@domain";
import { PlaybackService } from "./PlaybackService";
import { MediaService } from "./MediaService";

/**
 * The application-facing facade over the kernel — the single handle the UI
 * holds. It hides the plugin container: the view subscribes to state via
 * `events`, issues commands/use-cases via `playback` / `media`, and manages
 * the kernel lifecycle via `dispose` — it never resolves plugins, touches the
 * provider, or reaches into Planet internals.
 *
 * Provider resolution lives here (not in the UI): both services are bound to a
 * getter that re-reads the mounted provider plugin, so a future provider switch
 * needs no service rewiring. Dependency direction: core/application → kernel +
 * domain (inner layers); never React, never concrete `@providers`.
 */
export class Engine {
  readonly playback: PlaybackService;
  readonly media: MediaService;

  constructor(private readonly planet: IPlanet) {
    const getProvider = (): IProvider => {
      const provider = planet.getPlugin<IProvider & IPlugin>(PROVIDER_PLUGIN_ID);
      if (!provider) {
        throw new Error(
          "No provider plugin registered on the Planet. Register one (e.g. NeteaseCloudMusic).",
        );
      }
      return provider;
    };
    this.playback = new PlaybackService(planet, getProvider);
    this.media = new MediaService(getProvider);
  }

  /** The kernel event bus — UI store-bridges subscribe here for playback/state. */
  get events(): IPlanet["hooks"] {
    return this.planet.hooks;
  }

  /** Unmount the kernel (app teardown / future provider switch). */
  dispose(): void {
    this.planet.dispose();
  }
}
