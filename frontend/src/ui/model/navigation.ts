import { clampIndex } from "@shared/number";
import type { CatalogAvailability } from "@contexts/catalog";

import type { LocalizedText } from "@/i18n/text";
import type { IconName } from "@/infra/icons";
import type { ShellScreenView } from "@/model/shell-screen";
import type { LibrarySectionTab, ScreenData, VibeTrack } from "@/model/vibe";

export type XmbItemModel = {
  key: string;
  label: LocalizedText;
  sub?: LocalizedText;
  icon?: IconName;
  seed: number;
  grad?: string[];
  image?: string;
  run?: () => void;
};

export type XmbCat = {
  id: string;
  icon: IconName;
  label: LocalizedText;
  items: XmbItemModel[];
};

export type NavContext = {
  catalog: ScreenData;
  availability: CatalogAvailability;
  liked: ReadonlySet<string>;
  current?: VibeTrack;
  queueLength: number;
};

export type NavActions = {
  goto: (view: ShellScreenView) => void;
  openSearch: () => void;
  openLibrary: (tab: LibrarySectionTab) => void;
  openLikedSongs: () => void;
};

export type XmbRowMemory = Record<number, number>;

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
  "category-previous" | "category-next" | "row-previous" | "row-next" | "open" | "none";

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

export function buildWorlds(ctx: NavContext, actions: NavActions): XmbCat[] {
  const { catalog, availability, liked, current, queueLength } = ctx;
  const { goto, openSearch, openLibrary, openLikedSongs } = actions;

  const discover: XmbItemModel[] = [];
  if (availability.personalized) {
    discover.push({
      key: "foryou",
      label: { key: "nav.forYou" },
      sub: { key: "nav.yourDailyLanding" },
      icon: "star",
      seed: 7,
      grad: ["#1b1033", "#ff2188"],
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
      run: openSearch,
    });
  }

  const playerTile: XmbItemModel[] = current
    ? [
        {
          key: "player",
          label: current.title ? { text: current.title } : { key: "common.nowPlaying" },
          sub: current.artist ? { text: current.artist } : undefined,
          icon: "play",
          seed: current.coverSeed || 0,
          grad: current.gradient,
          image: current.image,
          run: () => goto("np"),
        },
      ]
    : [];

  const worlds: XmbCat[] = [
    {
      id: "np",
      icon: "play",
      label: { key: "common.nowPlaying" },
      items: [
        ...playerTile,
        {
          key: "queue",
          label: { key: "common.upNext" },
          sub: { key: "counts.queued", values: { count: queueLength } },
          icon: "list",
          seed: 5,
          run: () => goto("queue"),
        },
        {
          key: "history",
          label: { key: "common.history" },
          sub: { key: "nav.historySub" },
          icon: "clock",
          seed: 12,
          grad: ["#161320", "#8a7bff"],
          run: () => goto("history"),
        },
      ],
    },
    {
      id: "discover",
      icon: "compass",
      label: { key: "common.discover" },
      items: discover,
    },
    {
      id: "library",
      icon: "stack",
      label: { key: "common.library" },
      items: [
        {
          key: "liked",
          label: { key: "library.likedSongs" },
          sub: { key: "counts.tracks", values: { count: liked.size } },
          icon: "heart",
          seed: 0,
          grad: ["#2a0420", "#ff4fa3"],
          run: openLikedSongs,
        },
        {
          key: "playlists",
          label: { key: "common.playlists" },
          sub: { key: "counts.playlists", values: { count: catalog.playlists.length } },
          icon: "list",
          seed: 1,
          grad: ["#1a0d3a", "#7755ff"],
          run: () => openLibrary("playlists"),
        },
        {
          key: "albums",
          label: { key: "common.albums" },
          sub: { key: "counts.albums", values: { count: catalog.albums.length } },
          icon: "stack",
          seed: 2,
          grad: ["#3a0d10", "#f3727f"],
          run: () => openLibrary("albums"),
        },
        {
          key: "artists",
          label: { key: "common.artists" },
          sub: { key: "counts.artistsFollowing", values: { count: catalog.artists.length } },
          icon: "user",
          seed: 4,
          grad: ["#06222b", "#19d3c5"],
          run: () => openLibrary("artists"),
        },
      ],
    },
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
          run: () => goto("profile"),
        },
        {
          key: "stats",
          label: { key: "nav.listening" },
          sub: { key: "nav.listeningSub" },
          icon: "bars",
          seed: 9,
          grad: ["#2a0420", "#ff4fa3"],
          run: () => goto("profile"),
        },
      ],
    },
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
          run: () => goto("settings"),
        },
        {
          key: "about",
          label: { key: "nav.about" },
          sub: { key: "nav.aboutSub" },
          icon: "note",
          seed: 2,
          run: () => goto("settings"),
        },
      ],
    },
  ];

  return worlds.filter((w) => w.items.length > 0);
}
