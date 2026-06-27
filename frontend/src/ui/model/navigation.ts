/**
 * Navigation information architecture — the XMB launcher tree.
 *
 * This is the view-model of "how a user relates to their music": a
 * capability-aware priority tree (see docs/core-architecture.md §11).
 *   L1 = bounded-context "worlds" (Now Playing · Discover · Library · You · Settings)
 *   L2 = each world's entries, in priority order (most-likely-wanted first)
 *
 * It lives in the model layer (not the XMB screen) because it describes the
 * domain's IA, not pixels: `buildWorlds` is a pure projection of catalog +
 * provider capabilities + session state into menu structure, independently
 * testable and free of React. The XMB screen consumes these types.
 */
import type { ProviderCapability } from "@domain";

import type { ScreenData, VibeTrack } from "@/model/adapt";

/** One XMB sub-item (a launcher tile under a category). */
export type XmbItemModel = {
  key: string;
  label: string;
  sub?: string;
  icon?: string;
  seed: number;
  grad?: string[];
  image?: string;
  dest: string;
  run?: () => void;
};

/** One XMB category column: an icon + a vertical list of items. */
export type XmbCat = {
  id: string;
  icon: string;
  label: string;
  items: XmbItemModel[];
};

/** Session/data inputs the tree projects into menu structure. */
export type NavContext = {
  catalog: ScreenData;
  /** Active-provider capability predicate (MediaService.supports). */
  supports: (cap: ProviderCapability) => boolean;
  liked: ReadonlySet<string>;
  current?: VibeTrack;
  queueLength: number;
};

/** The run-handlers each tile is wired to (owned by the Shell navigator). */
export type NavActions = {
  /** Switch to a bare view (the within-launcher destinations). */
  goto: (view: string) => void;
  openSearch: () => void;
  openLibrary: (tab: string) => void;
  openLikedSongs: () => void;
};

/**
 * Build the XMB navigation tree. Now Playing / Library / You / Settings are
 * local (always present); only Discover is provider-gated. Discover entries are
 * authored in priority order (most-likely-wanted first); Browse-by-facet has no
 * provider capability yet, so it is reserved (priority #2) but omitted until one
 * exists. Empty worlds drop out.
 */
export function buildWorlds(ctx: NavContext, actions: NavActions): XmbCat[] {
  const { catalog, supports, liked, current, queueLength } = ctx;
  const { goto, openSearch, openLibrary, openLikedSongs } = actions;

  // 2 · DISCOVER — Catalog (find music). Provider-capability gated.
  const discover: XmbItemModel[] = [];
  if (supports("personalized")) {
    discover.push({
      key: "foryou",
      label: "For You",
      sub: "Your daily landing",
      icon: "star",
      seed: 7,
      grad: ["#1b1033", "#ff2188"],
      dest: "home",
      run: () => goto("home"),
    });
  }
  if (supports("toplist")) {
    discover.push({
      key: "charts",
      label: "Charts",
      sub: "Ranked by plays",
      icon: "bars",
      seed: 10,
      grad: ["#240b04", "#ff8a3c"],
      dest: "charts",
      run: () => goto("charts"),
    });
  }
  if (supports("search")) {
    discover.push({
      key: "search",
      label: "Search",
      sub: "Tracks, artists, albums",
      icon: "search",
      seed: 6,
      grad: ["#021e24", "#36c5e0"],
      dest: "search",
      run: openSearch,
    });
  }

  const worlds: XmbCat[] = [
    // 1 · NOW PLAYING — the live session: present (Player) · future (Up Next) · past (History).
    {
      id: "np",
      icon: "play",
      label: "Now Playing",
      items: [
        {
          key: "player",
          label: current?.title || "Now Playing",
          sub: current?.artist,
          icon: "play",
          seed: current?.coverSeed || 0,
          grad: current?.gradient,
          image: current?.image,
          dest: "np",
          run: () => goto("np"),
        },
        {
          key: "queue",
          label: "Up Next",
          sub: queueLength + " tracks queued",
          icon: "list",
          seed: 5,
          dest: "queue",
          run: () => goto("queue"),
        },
        {
          key: "history",
          label: "History",
          sub: "Recently played",
          icon: "clock",
          seed: 12,
          grad: ["#161320", "#8a7bff"],
          dest: "history",
          run: () => goto("history"),
        },
      ],
    },
    // 2 · DISCOVER — Catalog (find music), provider-gated (built above).
    {
      id: "discover",
      icon: "compass",
      label: "Discover",
      items: discover,
    },
    // 3 · LIBRARY — the user's own world (local, never gated).
    {
      id: "library",
      icon: "stack",
      label: "Library",
      items: [
        {
          key: "liked",
          label: "Liked Songs",
          sub: liked.size + " tracks",
          icon: "heart",
          seed: 0,
          grad: ["#2a0420", "#ff4fa3"],
          dest: "detail",
          run: openLikedSongs,
        },
        {
          key: "playlists",
          label: "Playlists",
          sub: catalog.playlists.length + " playlists",
          icon: "list",
          seed: 1,
          grad: ["#1a0d3a", "#7755ff"],
          dest: "library",
          run: () => openLibrary("playlists"),
        },
        {
          key: "albums",
          label: "Albums",
          sub: catalog.albums.length + " albums",
          icon: "stack",
          seed: 2,
          grad: ["#3a0d10", "#f3727f"],
          dest: "library",
          run: () => openLibrary("albums"),
        },
        {
          key: "artists",
          label: "Artists",
          sub: catalog.artists.length + " following",
          icon: "user",
          seed: 4,
          grad: ["#06222b", "#19d3c5"],
          dest: "library",
          run: () => openLibrary("artists"),
        },
      ],
    },
    // 4 · YOU — identity / taste (local).
    {
      id: "you",
      icon: "user",
      label: "You",
      items: [
        {
          key: "profile",
          label: "Profile",
          sub: "You",
          icon: "user",
          seed: 3,
          grad: ["#1b1033", "#ff2188"],
          dest: "profile",
          run: () => goto("profile"),
        },
        {
          key: "stats",
          label: "Listening",
          sub: "Your top artists & minutes",
          icon: "bars",
          seed: 9,
          grad: ["#2a0420", "#ff4fa3"],
          dest: "profile",
          run: () => goto("profile"),
        },
      ],
    },
    // 5 · SETTINGS — the tool (local).
    {
      id: "settings",
      icon: "gear",
      label: "Settings",
      items: [
        {
          key: "prefs",
          label: "Preferences",
          sub: "Audio, theme, interface",
          icon: "gear",
          seed: 9,
          grad: ["#13031f", "#b15cff"],
          dest: "settings",
          run: () => goto("settings"),
        },
        {
          key: "about",
          label: "About Sonance",
          sub: "Version 2.0",
          icon: "note",
          seed: 2,
          dest: "settings",
          run: () => goto("settings"),
        },
      ],
    },
  ];

  // Never show an empty world (e.g. Discover when the provider supports none of its entries).
  return worlds.filter((w) => w.items.length > 0);
}
