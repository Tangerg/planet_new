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
import { clampIndex } from "@shared/number";
import type { CatalogAvailability } from "@contexts/catalog";

import type { LocalizedText } from "@/i18n/text";
import type { ScreenData, VibeTrack } from "@/model/vibe";

/** One XMB sub-item (a launcher tile under a category). Display text is named,
 *  not formatted: this projection is pure, so the XMB screen resolves it. */
export type XmbItemModel = {
  key: string;
  label: LocalizedText;
  sub?: LocalizedText;
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
  label: LocalizedText;
  items: XmbItemModel[];
};

/** Session/data inputs the tree projects into menu structure. */
export type NavContext = {
  catalog: ScreenData;
  /** Active-source availability projected from its registered Catalog ports. */
  availability: CatalogAvailability;
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

export type XmbRowMemory = Record<string, number>;

export function xmbSelectedRow(rows: XmbRowMemory, categoryIndex: number): number {
  return rows[categoryIndex] || 0;
}

export function xmbMoveCategory(
  currentIndex: number,
  delta: number,
  categoryCount: number,
): number {
  return clampIndex(currentIndex + delta, categoryCount);
}

export function xmbSelectRow(
  rows: XmbRowMemory,
  categoryIndex: number,
  rowIndex: number,
  itemCount: number,
): XmbRowMemory {
  return {
    ...rows,
    [categoryIndex]: clampIndex(rowIndex, itemCount),
  };
}

export type XmbInputIntent =
  | "category-previous"
  | "category-next"
  | "row-previous"
  | "row-next"
  | "open"
  | "none";

export const XMB_WHEEL_MIN_DELTA = 6;
export const XMB_WHEEL_AXIS_DEADZONE = 2;
export const XMB_WHEEL_COOLDOWN_MS = 250;

export function xmbKeyboardIntent(key: string): XmbInputIntent {
  if (key === "ArrowLeft") return "category-previous";
  if (key === "ArrowRight") return "category-next";
  if (key === "ArrowUp") return "row-previous";
  if (key === "ArrowDown") return "row-next";
  if (key === "Enter") return "open";
  return "none";
}

export function xmbWheelIntent(
  deltaX: number,
  deltaY: number,
  minDelta = XMB_WHEEL_MIN_DELTA,
  axisDeadzone = XMB_WHEEL_AXIS_DEADZONE,
): XmbInputIntent {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  if (Math.max(absX, absY) < minDelta) return "none";
  if (absX > absY + axisDeadzone) return deltaX > 0 ? "category-next" : "category-previous";
  return deltaY > 0 ? "row-next" : "row-previous";
}

export function xmbWheelNavigation({
  deltaX,
  deltaY,
  nextAllowedAt,
  now,
  cooldownMs = XMB_WHEEL_COOLDOWN_MS,
}: {
  deltaX: number;
  deltaY: number;
  nextAllowedAt: number;
  now: number;
  cooldownMs?: number;
}): { intent: XmbInputIntent; nextAllowedAt: number } {
  if (now < nextAllowedAt) return { intent: "none", nextAllowedAt };
  const intent = xmbWheelIntent(deltaX, deltaY);
  return {
    intent,
    nextAllowedAt: intent === "none" ? nextAllowedAt : now + cooldownMs,
  };
}

/**
 * Build the XMB navigation tree. Now Playing / Library / You / Settings are
 * local (always present); only Discover is provider-gated. Discover entries are
 * authored in priority order (most-likely-wanted first); Browse-by-facet has no
 * provider capability yet, so it is reserved (priority #2) but omitted until one
 * exists. Empty worlds drop out.
 */
export function buildWorlds(ctx: NavContext, actions: NavActions): XmbCat[] {
  const { catalog, availability, liked, current, queueLength } = ctx;
  const { goto, openSearch, openLibrary, openLikedSongs } = actions;

  // 2 · DISCOVER — Catalog (find music). Provider-capability gated.
  const discover: XmbItemModel[] = [];
  if (availability.personalized) {
    discover.push({
      key: "foryou",
      label: { key: "nav.forYou" },
      sub: { key: "nav.yourDailyLanding" },
      icon: "star",
      seed: 7,
      grad: ["#1b1033", "#ff2188"],
      dest: "home",
      run: () => goto("home"),
    });
  }
  if (availability.toplist) {
    discover.push({
      key: "charts",
      label: { key: "common.charts" },
      sub: { key: "nav.rankedByPlays" },
      icon: "bars",
      seed: 10,
      grad: ["#240b04", "#ff8a3c"],
      dest: "charts",
      run: () => goto("charts"),
    });
  }
  if (availability.search) {
    discover.push({
      key: "search",
      label: { key: "common.search" },
      sub: { key: "nav.discoverSearchSub" },
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
      label: { key: "common.nowPlaying" },
      items: [
        ...(current
          ? [
              {
                key: "player",
                label: current.title ? { text: current.title } : { key: "common.nowPlaying" },
                sub: current.artist ? { text: current.artist } : undefined,
                icon: "play",
                seed: current.coverSeed || 0,
                grad: current.gradient,
                image: current.image,
                dest: "np",
                run: () => goto("np"),
              },
            ]
          : []),
        {
          key: "queue",
          label: { key: "common.upNext" },
          sub: { key: "counts.queued", values: { count: queueLength } },
          icon: "list",
          seed: 5,
          dest: "queue",
          run: () => goto("queue"),
        },
        {
          key: "history",
          label: { key: "common.history" },
          sub: { key: "nav.historySub" },
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
      label: { key: "common.discover" },
      items: discover,
    },
    // 3 · LIBRARY — the user's own world (local, never gated).
    {
      id: "library",
      icon: "stack",
      label: { key: "common.library" },
      items: [
        {
          key: "liked",
          label: { key: "nav.likedSongs" },
          sub: { key: "counts.tracks", values: { count: liked.size } },
          icon: "heart",
          seed: 0,
          grad: ["#2a0420", "#ff4fa3"],
          dest: "detail",
          run: openLikedSongs,
        },
        {
          key: "playlists",
          label: { key: "common.playlists" },
          sub: { key: "counts.playlists", values: { count: catalog.playlists.length } },
          icon: "list",
          seed: 1,
          grad: ["#1a0d3a", "#7755ff"],
          dest: "library",
          run: () => openLibrary("playlists"),
        },
        {
          key: "albums",
          label: { key: "common.albums" },
          sub: { key: "counts.albums", values: { count: catalog.albums.length } },
          icon: "stack",
          seed: 2,
          grad: ["#3a0d10", "#f3727f"],
          dest: "library",
          run: () => openLibrary("albums"),
        },
        {
          key: "artists",
          label: { key: "common.artists" },
          sub: { key: "counts.artistsFollowing", values: { count: catalog.artists.length } },
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
      label: { key: "common.profile" },
      items: [
        {
          key: "profile",
          label: { key: "common.profile" },
          sub: { key: "nav.profileSub" },
          icon: "user",
          seed: 3,
          grad: ["#1b1033", "#ff2188"],
          dest: "profile",
          run: () => goto("profile"),
        },
        {
          key: "stats",
          label: { key: "nav.listening" },
          sub: { key: "nav.listeningSub" },
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
      label: { key: "common.settings" },
      items: [
        {
          key: "prefs",
          label: { key: "nav.preferences" },
          sub: { key: "nav.audioThemeInterface" },
          icon: "gear",
          seed: 9,
          grad: ["#13031f", "#b15cff"],
          dest: "settings",
          run: () => goto("settings"),
        },
        {
          key: "about",
          label: { key: "nav.about" },
          sub: { key: "nav.aboutSub" },
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
