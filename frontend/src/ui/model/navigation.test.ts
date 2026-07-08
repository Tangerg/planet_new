import { describe, expect, it, vi } from "vitest";

import type { ProviderCapability } from "@domain";

import {
  buildWorlds,
  nounCount,
  xmbKeyboardIntent,
  xmbMoveCategory,
  xmbSelectedRow,
  xmbSelectRow,
  xmbWheelIntent,
  xmbWheelNavigation,
} from "./navigation";
import type { NavActions } from "./navigation";
import type { ScreenData, VibeTrack } from "./vibe";

const track = (overrides: Partial<VibeTrack> = {}): VibeTrack => ({
  id: "track",
  title: "Now",
  name: "Now",
  artist: "Artist",
  coverSeed: 11,
  durSec: 10,
  duration: "0:10",
  ...overrides,
});

const catalog = (overrides: Partial<ScreenData> = {}): ScreenData => ({
  playlists: [],
  albums: [],
  artists: [],
  allTracks: [],
  ...overrides,
});

const supports =
  (...capabilities: ProviderCapability[]) =>
  (capability: ProviderCapability) =>
    capabilities.includes(capability);

function actions(): NavActions {
  return {
    goto: vi.fn<(view: string) => void>(),
    openSearch: vi.fn<() => void>(),
    openLibrary: vi.fn<(tab: string) => void>(),
    openLikedSongs: vi.fn<() => void>(),
  };
}

describe("navigation model", () => {
  it("formats simple English count labels", () => {
    expect(nounCount(0, "track")).toBe("0 tracks");
    expect(nounCount(1, "track")).toBe("1 track");
    expect(nounCount(2, "playlist")).toBe("2 playlists");
    expect(nounCount(2, "person", "people")).toBe("2 people");
  });

  it("drops Discover when the provider exposes no discover capabilities", () => {
    const worlds = buildWorlds(
      {
        catalog: catalog(),
        supports: supports(),
        liked: new Set(),
        queueLength: 0,
      },
      actions(),
    );

    expect(worlds.map((world) => world.id)).toEqual(["np", "library", "you", "settings"]);
  });

  it("gates Discover entries by provider capability and wires actions", () => {
    const navActions = actions();
    const worlds = buildWorlds(
      {
        catalog: catalog(),
        supports: supports("personalized", "search"),
        liked: new Set(),
        current: track(),
        queueLength: 1,
      },
      navActions,
    );
    const discover = worlds.find((world) => world.id === "discover");
    const nowPlaying = worlds.find((world) => world.id === "np");

    expect(discover?.items.map((item) => item.key)).toEqual(["foryou", "search"]);
    expect(nowPlaying?.items[0]).toMatchObject({
      label: "Now",
      sub: "Artist",
      seed: 11,
      dest: "np",
    });
    expect(nowPlaying?.items[1].sub).toBe("1 track queued");

    discover?.items[0].run?.();
    discover?.items[1].run?.();
    nowPlaying?.items[1].run?.();
    expect(navActions.goto).toHaveBeenCalledWith("home");
    expect(navActions.openSearch).toHaveBeenCalled();
    expect(navActions.goto).toHaveBeenCalledWith("queue");
  });

  it("does not expose a Now Playing player entry before a track exists", () => {
    const worlds = buildWorlds(
      {
        catalog: catalog(),
        supports: supports(),
        liked: new Set(),
        queueLength: 0,
      },
      actions(),
    );
    const nowPlaying = worlds.find((world) => world.id === "np");

    expect(nowPlaying?.items.map((item) => item.key)).toEqual(["queue", "history"]);
  });

  it("summarizes library counts and dispatches library actions", () => {
    const navActions = actions();
    const worlds = buildWorlds(
      {
        catalog: catalog({
          playlists: [{ id: "p", name: "P", kind: "Playlist", coverSeed: 1, tracks: [] }],
          albums: [{ id: "a", name: "A", kind: "Album", coverSeed: 1, tracks: [] }],
          artists: [{ id: "ar", name: "Ar", coverSeed: 1 }],
        }),
        supports: supports("toplist"),
        liked: new Set(["liked"]),
        queueLength: 2,
      },
      navActions,
    );
    const library = worlds.find((world) => world.id === "library");

    expect(library?.items.map((item) => item.sub)).toEqual([
      "1 track",
      "1 playlist",
      "1 album",
      "1 following",
    ]);
    library?.items[0].run?.();
    library?.items[1].run?.();
    library?.items[2].run?.();
    library?.items[3].run?.();
    expect(navActions.openLikedSongs).toHaveBeenCalled();
    expect(navActions.openLibrary).toHaveBeenNthCalledWith(1, "playlists");
    expect(navActions.openLibrary).toHaveBeenNthCalledWith(2, "albums");
    expect(navActions.openLibrary).toHaveBeenNthCalledWith(3, "artists");
  });

  it("clamps XMB category cursor movement to the available range", () => {
    expect(xmbMoveCategory(1, -3, 5)).toBe(0);
    expect(xmbMoveCategory(1, 2, 5)).toBe(3);
    expect(xmbMoveCategory(4, 2, 5)).toBe(4);
  });

  it("remembers one selected XMB row per category", () => {
    const rows = xmbSelectRow({ 0: 2 }, 1, 99, 4);

    expect(rows).toEqual({ 0: 2, 1: 3 });
    expect(xmbSelectedRow(rows, 0)).toBe(2);
    expect(xmbSelectedRow(rows, 1)).toBe(3);
    expect(xmbSelectedRow(rows, 2)).toBe(0);
  });

  it("maps XMB keyboard input to navigation intents", () => {
    expect(xmbKeyboardIntent("ArrowLeft")).toBe("category-previous");
    expect(xmbKeyboardIntent("ArrowRight")).toBe("category-next");
    expect(xmbKeyboardIntent("ArrowUp")).toBe("row-previous");
    expect(xmbKeyboardIntent("ArrowDown")).toBe("row-next");
    expect(xmbKeyboardIntent("Enter")).toBe("open");
    expect(xmbKeyboardIntent("Escape")).toBe("none");
  });

  it("maps XMB wheel input to the dominant navigation axis", () => {
    expect(xmbWheelIntent(3, 2)).toBe("none");
    expect(xmbWheelIntent(12, 4)).toBe("category-next");
    expect(xmbWheelIntent(-12, 4)).toBe("category-previous");
    expect(xmbWheelIntent(8, 12)).toBe("row-next");
    expect(xmbWheelIntent(8, -12)).toBe("row-previous");
  });

  it("throttles XMB wheel navigation after a real intent", () => {
    expect(xmbWheelNavigation({ deltaX: 12, deltaY: 0, now: 100, nextAllowedAt: 120 })).toEqual({
      intent: "none",
      nextAllowedAt: 120,
    });

    expect(xmbWheelNavigation({ deltaX: 3, deltaY: 0, now: 130, nextAllowedAt: 120 })).toEqual({
      intent: "none",
      nextAllowedAt: 120,
    });

    expect(xmbWheelNavigation({ deltaX: 12, deltaY: 0, now: 130, nextAllowedAt: 120 })).toEqual({
      intent: "category-next",
      nextAllowedAt: 380,
    });
  });
});
