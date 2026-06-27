import { Plugin } from "../../kernel";
import type { IPlugin } from "../../kernel";
import { type IProvider, PROVIDER_PLUGIN_ID } from "@domain";
import type { Lyric } from "@domain/model/lyric";
import type { Track } from "@domain/model/track";

declare module "../../kernel/event" {
  interface PlanetEventMap {
    lyric_changed: Lyric[];
  }
}

/**
 * Reactive lyric source. Follows the current track: on current_track_changed it
 * resolves the provider (a sibling plugin) and fetches its lyrics, broadcasting
 * lyric_changed. The UI reads the current lyrics from the store and never
 * fetches them — it doesn't even know which track's lyrics to ask for. This is
 * the "reactive business → kernel plugin" pattern (vs. on-demand browse reads,
 * which stay in MediaService + the UI's React Query cache).
 */
export class LyricPlugin extends Plugin {
  public static readonly id = "lyric";
  readonly dependsOn = [PROVIDER_PLUGIN_ID];

  get id(): string {
    return LyricPlugin.id;
  }

  /** Last track id fetched — skip refetch when the track hasn't actually changed. */
  private lastTrackId: string | undefined;
  /** Generation guard: a newer track supersedes a slow in-flight lyric fetch. */
  private generation = 0;

  protected onInit(): void {
    this.context.hooks.on("current_track_changed", this.onTrackChanged, this);
  }

  protected onDispose(): void {
    this.context.hooks.off("current_track_changed", this.onTrackChanged);
    this.lastTrackId = undefined;
    this.generation = 0;
  }

  private onTrackChanged = async (track: Track | undefined): Promise<void> => {
    const id = track?.id ? String(track.id) : "";
    if (id === this.lastTrackId) return;
    this.lastTrackId = id;
    const gen = ++this.generation;

    if (!id) {
      this.context.hooks.emit("lyric_changed", []);
      return;
    }

    const provider = this.context.getPlugin<IProvider & IPlugin>(PROVIDER_PLUGIN_ID);
    let lyrics: Lyric[] = [];
    try {
      lyrics = provider ? await provider.lyric(id) : [];
    } catch {
      // Provider lacks lyric support / fetch failed → emit empty (UI shows "no lyrics").
      lyrics = [];
    }

    // Stale guard: a newer track changed since this fetch began — drop the result.
    if (gen !== this.generation) return;
    this.context.hooks.emit("lyric_changed", lyrics);
  };
}
