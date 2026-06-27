import { describe, expect, test } from "vitest";
import type { Track } from "./track";
import { PlayQueue } from "./play-queue";
import { RepeatMode } from "./repeat";

const track = (id: string): Track => ({ id, name: id, durationMs: 1000, artists: [] });
const ids = (q: PlayQueue) => q.tracks.map((t) => t.id);
const [t1, t2, t3] = [track("1"), track("2"), track("3")];

describe("PlayQueue.setTracks", () => {
  test("starts at the given track, else the first", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2, t3], t2);
    expect(q.current?.id).toBe("2");

    q.setTracks([t1, t2, t3]);
    expect(q.current?.id).toBe("1");
  });

  test("empty queue has no current", () => {
    const q = new PlayQueue();
    q.setTracks([]);
    expect(q.current).toBeUndefined();
    expect(q.size).toBe(0);
  });
});

describe("PlayQueue user skip (cyclic)", () => {
  test("next/previous wrap around the ends", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2, t3], t3);
    expect(q.next()?.id).toBe("1"); // wrap forward
    expect(q.previous()?.id).toBe("3"); // wrap backward
  });
});

describe("PlayQueue.advance (track ended, repeat-aware)", () => {
  test("repeat one replays without moving", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2], t1);
    expect(q.advance(RepeatMode.ONE)).toBe("replay");
    expect(q.current?.id).toBe("1");
  });

  test("repeat off stops at the last track, advances otherwise", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2], t1);
    expect(q.advance(RepeatMode.OFF)).toBe("advanced");
    expect(q.current?.id).toBe("2");
    expect(q.advance(RepeatMode.OFF)).toBe("stopped");
    expect(q.current?.id).toBe("2");
  });

  test("repeat all wraps past the last track", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2], t2);
    expect(q.advance(RepeatMode.ALL)).toBe("advanced");
    expect(q.current?.id).toBe("1");
  });

  test("empty queue stops", () => {
    expect(new PlayQueue().advance(RepeatMode.ALL)).toBe("stopped");
  });
});

describe("PlayQueue.select", () => {
  test("moves to a present track, no-ops on same or absent", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2, t3], t1);
    expect(q.select(t3)).toBe(true);
    expect(q.current?.id).toBe("3");
    expect(q.select(t3)).toBe(false); // already current
    expect(q.select(track("nope"))).toBe(false);
  });
});

describe("PlayQueue.add / remove", () => {
  test("add appends once; duplicates are ignored", () => {
    const q = new PlayQueue();
    q.setTracks([t1]);
    q.add(t2);
    q.add(t2);
    expect(ids(q)).toEqual(["1", "2"]);
  });

  test("removing the current track lands the cursor on the next", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2, t3], t2);
    q.remove(t2);
    expect(ids(q)).toEqual(["1", "3"]);
    expect(q.current?.id).toBe("3");
  });

  test("removing the last while current wraps to the start", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2], t2);
    q.remove(t2);
    expect(q.current?.id).toBe("1");
  });

  test("removing everything empties the queue", () => {
    const q = new PlayQueue();
    q.setTracks([t1]);
    q.remove(t1);
    expect(q.size).toBe(0);
    expect(q.current).toBeUndefined();
  });
});

describe("PlayQueue.toggleShuffle", () => {
  test("keeps display order and the current track, only changes play sequence", () => {
    const q = new PlayQueue();
    const many = Array.from({ length: 8 }, (_, i) => track(String(i)));
    q.setTracks(many, many[3]);
    const before = q.current;

    expect(q.toggleShuffle()).toBe(true);
    expect(q.isShuffled).toBe(true);
    expect(ids(q)).toEqual(many.map((t) => t.id)); // display order untouched
    expect(q.current).toBe(before); // cursor still on the same track
    expect(q.size).toBe(8);

    expect(q.toggleShuffle()).toBe(false);
    expect(q.current).toBe(before);
  });
});
