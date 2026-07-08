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

describe("PlayQueue.upNext", () => {
  test("projects the tracks after current without mutating display order", () => {
    expect(PlayQueue.upNext([t1, t2, t3], t1).map((t) => t.id)).toEqual(["2", "3"]);
    expect(PlayQueue.upNext([t1, t2, t3], t3)).toEqual([]);
  });

  test("returns the full list when there is no current match", () => {
    expect(PlayQueue.upNext([t1, t2], undefined).map((t) => t.id)).toEqual(["1", "2"]);
    expect(PlayQueue.upNext([t1, t2], track("missing")).map((t) => t.id)).toEqual(["1", "2"]);
  });

  test("uses the actual playback order when read from an instance", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2, t3], t2);
    expect(q.upNext.map((t) => t.id)).toEqual(["3"]);
  });
});

describe("PlayQueue user skip", () => {
  test("does not wrap in sequence mode", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2, t3], t3);
    expect(q.next(RepeatMode.OFF)).toBe("unchanged");
    expect(q.current?.id).toBe("3");

    q.setTracks([t1, t2, t3], t1);
    expect(q.previous(RepeatMode.OFF)).toBe("unchanged");
    expect(q.current?.id).toBe("1");
  });

  test("wraps at the ends only in list-repeat mode", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2, t3], t3);
    expect(q.next(RepeatMode.ALL)).toBe("changed");
    expect(q.current?.id).toBe("1");
    expect(q.previous(RepeatMode.ALL)).toBe("changed");
    expect(q.current?.id).toBe("3");
  });

  test("can start from a queued item when there is no current track", () => {
    const q = new PlayQueue();
    q.add(t1);
    q.add(t2);

    expect(q.current).toBeUndefined();
    expect(q.next(RepeatMode.OFF)).toBe("changed");
    expect(q.current?.id).toBe("1");
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
    expect(q.add(t2)).toBe(true);
    expect(q.add(t2)).toBe(false);
    expect(ids(q)).toEqual(["1", "2"]);
  });

  test("addNext inserts a new track directly after current", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t3], t1);
    expect(q.addNext(t2)).toBe(true);
    expect(q.playbackOrder.map((t) => t.id)).toEqual(["1", "2", "3"]);
    expect(q.upNext.map((t) => t.id)).toEqual(["2", "3"]);
  });

  test("addNext moves an existing queued track after current", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2, t3], t2);
    expect(q.addNext(t1)).toBe(true);
    expect(q.playbackOrder.map((t) => t.id)).toEqual(["2", "1", "3"]);
    expect(q.current?.id).toBe("2");
    expect(q.addNext(t2)).toBe(false);
  });

  test("removing the current track lands the cursor on the next", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2, t3], t2);
    expect(q.remove(t2)).toBe(true);
    expect(ids(q)).toEqual(["1", "3"]);
    expect(q.current?.id).toBe("3");
  });

  test("removing the current tail leaves the queue but stops the current track", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2], t2);
    q.remove(t2);
    expect(ids(q)).toEqual(["1"]);
    expect(q.current).toBeUndefined();
    expect(q.upNext.map((t) => t.id)).toEqual(["1"]);
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
    expect(q.playbackOrder[0]).toBe(before);
    expect(q.upNext).toHaveLength(7);

    expect(q.toggleShuffle()).toBe(false);
    expect(q.current).toBe(before);
  });

  test("setShuffle explicitly changes shuffle state without moving the current track", () => {
    const q = new PlayQueue();
    q.setTracks([t1, t2, t3], t2);
    const before = q.current;

    expect(q.setShuffle(true)).toBe(true);
    expect(q.isShuffled).toBe(true);
    expect(q.current).toBe(before);

    expect(q.setShuffle(true)).toBe(true);
    expect(q.current).toBe(before);

    expect(q.setShuffle(false)).toBe(false);
    expect(q.isShuffled).toBe(false);
    expect(q.current).toBe(before);
  });
});
