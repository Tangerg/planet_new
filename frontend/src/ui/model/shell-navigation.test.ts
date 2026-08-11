import { describe, expect, it } from "vitest";

import type { ShellScreenView } from "./shell-screen";
import type { NavSnapshot } from "./shell-navigation";
import {
  NavigationHistory,
  NavigationRequestGate,
  NavigationSession,
  createNavSnapshot,
} from "./shell-navigation";
import type { VibeTrack } from "./vibe";

type LastTile = { id: string };

const track = (id: string): VibeTrack => ({
  id,
  title: id,
  name: id,
  artist: "Artist",
  coverSeed: 1,
  durSec: 10,
  duration: "0:10",
});

const snapshot = (view: ShellScreenView, playContext: VibeTrack[] = []): NavSnapshot<LastTile> => ({
  view,
  detail: null,
  artistObj: { id: "", name: "" },
  musicVideoObj: null,
  musicVideoRelated: [],
  libraryTab: "playlists",
  libraryView: "grid",
  searchQuery: "",
  playContext,
  lastTile: { id: `${view}-tile` },
});

describe("shell navigation model", () => {
  it("copies mutable snapshot lists at the boundary", () => {
    const source = snapshot("detail", [track("t1")]);
    const copy = createNavSnapshot(source);

    source.playContext.push(track("t2"));

    expect(copy.playContext.map((item) => item.id)).toEqual(["t1"]);
  });

  it("keeps launcher snapshots out of the back stack", () => {
    const history = new NavigationHistory<LastTile>();

    history.push(snapshot("xmb"));
    history.push(snapshot("detail", [track("t1")]));

    expect(history.size).toBe(1);
    expect(history.pop()?.view).toBe("detail");
    expect(history.pop()).toBeNull();
  });

  it("clears and returns snapshots defensively", () => {
    const history = new NavigationHistory<LastTile>();
    history.push(snapshot("artist", [track("t1")]));
    const restored = history.pop();

    restored?.playContext.push(track("mutated"));

    expect(history.size).toBe(0);
    expect(history.pop()).toBeNull();

    history.push(snapshot("search"));
    history.clear();
    expect(history.pop()).toBeNull();
  });

  it("accepts only the latest navigation request ticket", () => {
    const gate = new NavigationRequestGate();
    const first = gate.start();
    const second = gate.start();

    expect(gate.accepts(first)).toBe(false);
    expect(gate.accepts(second)).toBe(true);

    gate.cancel();

    expect(gate.accepts(second)).toBe(false);
  });

  it("coordinates history and async freshness as one navigation session", () => {
    const session = new NavigationSession<LastTile>();

    session.beginForward(snapshot("xmb"));
    session.beginForward(snapshot("detail", [track("t1")]));
    const detailTicket = session.beginAsyncScreen(snapshot("artist", [track("t2")]));
    const backfillTicket = session.beginAsyncBackfill();

    expect(session.historySize).toBe(2);
    expect(session.accepts(detailTicket)).toBe(false);
    expect(session.accepts(backfillTicket)).toBe(true);

    const restored = session.beginBack();

    expect(restored?.view).toBe("artist");
    expect(session.accepts(backfillTicket)).toBe(false);
    expect(session.historySize).toBe(1);

    session.beginHome();

    expect(session.historySize).toBe(0);
    expect(session.beginBack()).toBeNull();
  });
});
