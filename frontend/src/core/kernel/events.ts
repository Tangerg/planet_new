import { event, type Event, type Logger } from "dougong";

import type { FormattedDuration, Progress } from "@domain/model/duration";
import type { Lyric } from "@domain/model/lyric";
import type { PlayState } from "@domain/model/play-state";
import type { RepeatMode } from "@domain/model/repeat";
import type { Track } from "@domain/model/track";

/*
 * The kernel's shared vocabulary of facts. A fact belongs to the graph, not to
 * whichever plugin happens to state it: the queue announces a new current
 * track, and playback / lyrics / analysis all react without importing one
 * another. Declaring the tokens in one module is what keeps those reactions
 * from turning into import cycles.
 */

export const QUEUE_CHANGED = event<readonly Track[]>("planet/queue/changed");
export const CURRENT_TRACK_CHANGED = event<Track | undefined>("planet/queue/current-changed");
export const REPEAT_CHANGED = event<RepeatMode>("planet/queue/repeat-changed");
export const SHUFFLE_CHANGED = event<boolean>("planet/queue/shuffle-changed");

export const PLAY_STATE_CHANGED = event<PlayState>("planet/playback/state-changed");
export const TRACK_ENDED = event<void>("planet/playback/track-ended");

export const DURATION_CHANGED = event<FormattedDuration>("planet/progress/duration-changed");
export const POSITION_CHANGED = event<Progress>("planet/progress/position-changed");

export const VOLUME_CHANGED = event<number>("planet/volume/changed");

export const LYRICS_CHANGED = event<readonly Lyric[]>("planet/lyrics/changed");

/**
 * States a fact without waiting for the reactions to it. Plugins broadcast from
 * synchronous command paths (a transport call, a DOM event handler), so a slow
 * or failing listener must not surface as a rejected promise inside the plugin
 * that merely reported what happened.
 */
export type Broadcast = <T>(fact: Event<T>, payload: T) => void;

/** The slice of a dougong plugin context a broadcaster needs. */
type FactSource = {
  readonly signal: AbortSignal;
  emit<T>(fact: Event<T>, payload: T): Promise<void>;
  readonly log: Logger;
};

export function broadcaster(source: FactSource): Broadcast {
  return (fact, payload) => {
    // In-flight work can outrace the Lifetime that owns it — a resolve landing
    // after the graph stopped, a DOM handler firing during teardown. Emitting
    // through a released Lifetime is an error, not a no-op, and a fact stated
    // then has no audience left anyway.
    if (source.signal.aborted) return;
    void source.emit(fact, payload).catch((error: unknown) => {
      source.log.error(`Listeners of '${fact.id}' failed`, error);
    });
  };
}
