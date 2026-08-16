import { describe, expect, it } from "vitest";

import type { Event } from "dougong";
import type { Track } from "@domain/model/track";
import { ProviderId } from "@domain/model/provider-id";

import { CURRENT_TRACK_CHANGED, QUEUE_CHANGED, type Broadcast } from "../../kernel";
import { PlayQueueRuntime } from "./index";

const TEST_PROVIDER_ID = ProviderId.of("test");

const track = (id: string, providerId = TEST_PROVIDER_ID): Track => ({
  providerId,
  id,
  name: id,
  durationMs: 1000,
  artists: [],
});

/** Records the facts the runtime states, in order, per event token. */
function mount() {
  const facts: { fact: Event<unknown>; payload: unknown }[] = [];
  const broadcast: Broadcast = (fact, ...payload) => {
    facts.push({ fact: fact as Event<unknown>, payload: payload[0] });
  };
  const runtime = new PlayQueueRuntime({ next: () => 0.5 }, broadcast);

  const stated = <T>(fact: Event<T>): T[] =>
    facts.filter((entry) => entry.fact === fact).map((entry) => entry.payload as T);

  return {
    runtime,
    currents: () => stated(CURRENT_TRACK_CHANGED),
    queues: () => stated(QUEUE_CHANGED),
  };
}

describe("PlayQueueRuntime facts", () => {
  it("broadcasts queue + current facts on playNow / next / previous / add", () => {
    const { runtime, currents, queues } = mount();

    const [a, b, c] = [track("a"), track("b"), track("c")];
    runtime.playNow([a, b], a);
    expect(queues().at(-1)).toEqual([a, b]);
    expect(currents().at(-1)).toBe(a);

    runtime.next();
    expect(currents().at(-1)).toBe(b);
    runtime.previous();
    expect(currents().at(-1)).toBe(a);

    runtime.add(c);
    expect(queues().at(-1)).toEqual([a, b, c]);
  });

  it("supports play-next insertion and emits playback-order changes", () => {
    const { runtime, queues } = mount();

    const [a, b, c] = [track("a"), track("b"), track("c")];
    runtime.playNow([a, c], a);
    runtime.addNext(b);

    expect(
      queues()
        .at(-1)
        ?.map((t) => t.id),
    ).toEqual(["a", "b", "c"]);
  });

  it("preserves colliding local ids from different providers", () => {
    const { runtime, currents, queues } = mount();
    const local = track("same");
    const remote = track("same", ProviderId.of("other"));

    runtime.playNow([local, remote], remote);
    expect(queues().at(-1)).toEqual([local, remote]);
    expect(currents().at(-1)).toBe(remote);

    runtime.remove(local);
    expect(queues().at(-1)).toEqual([remote]);
    expect(currents().at(-1)).toBe(remote);
  });

  it("does not wrap manual next in sequence mode, but does in list-repeat mode", () => {
    const { runtime, currents } = mount();

    const [a, b] = [track("a"), track("b")];
    runtime.playNow([a, b], b);
    const afterPlayNow = currents().length;

    runtime.next();
    expect(currents()).toHaveLength(afterPlayNow);

    runtime.cycleRepeat(); // off -> all
    runtime.next();
    expect(currents().at(-1)).toBe(a);
  });

  it("auto-advances after a track ends, then stops at the tail (repeat off)", () => {
    const { runtime, currents } = mount();

    const [a, b] = [track("a"), track("b")];
    runtime.playNow([a, b], a); // current → a
    const afterPlay = currents().length;

    runtime.advanceAfterTrackEnd();
    expect(currents().at(-1)).toBe(b); // advanced a → b

    runtime.advanceAfterTrackEnd();
    // b is the last track and repeat is off → "stopped", no new current fact.
    expect(currents().length).toBe(afterPlay + 1);
  });
});
