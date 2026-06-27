import { Plugin } from "../../kernel";
import { PROVIDER_REGISTRY, ProviderRegistry } from "../provider-registry";
import type { Lyric } from "@domain/model/lyric";
import type { Track } from "@domain/model/track";

declare module "../../kernel/event" {
  interface PlanetEventMap {
    "lyrics:changed": Lyric[];
  }
}

/**
 * Reactive lyric source. Follows the current track: on queue:current-changed it
 * resolves the active provider (via the ProviderRegistry) and fetches its
 * lyrics, broadcasting lyrics:changed. The UI reads the current lyrics from the
 * store and never fetches them — it doesn't even know which track's lyrics to
 * ask for. This is the "reactive business → kernel plugin" pattern (vs. on-demand
 * browse reads, which stay in MediaService + the UI's React Query cache).
 */
export class Lyrics extends Plugin {
  public static readonly id = "lyrics";
  readonly dependsOn = [ProviderRegistry.ID];

  get id(): string {
    return Lyrics.id;
  }

  /** Last track id fetched — skip refetch when the track hasn't actually changed. */
  private lastTrackId: string | undefined;
  /** Generation guard: a newer track supersedes a slow in-flight lyric fetch. */
  private generation = 0;

  protected onInit(): void {
    this.context.hooks.on("queue:current-changed", this.onTrackChanged, this);
  }

  protected onDispose(): void {
    this.context.hooks.off("queue:current-changed", this.onTrackChanged);
    this.lastTrackId = undefined;
    this.generation = 0;
  }

  private onTrackChanged = async (track: Track | undefined): Promise<void> => {
    const id = track?.id ? String(track.id) : "";
    if (id === this.lastTrackId) return;
    this.lastTrackId = id;
    const gen = ++this.generation;

    if (!id) {
      this.context.hooks.emit("lyrics:changed", []);
      return;
    }

    const provider = this.context.registry.resolve(PROVIDER_REGISTRY)?.active ?? null;
    let lyrics: Lyric[] = [];
    try {
      lyrics = provider ? await provider.lyric(id) : [];
    } catch {
      // Provider lacks lyric support / fetch failed → emit empty (UI shows "no lyrics").
      lyrics = [];
    }

    // Stale guard: a newer track changed since this fetch began — drop the result.
    if (gen !== this.generation) return;
    this.context.hooks.emit("lyrics:changed", lyrics);
  };
}
