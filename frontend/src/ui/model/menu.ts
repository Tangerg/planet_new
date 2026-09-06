import type { LocalizedText } from "@/i18n/text";
import type { IconName } from "@/infra/icons";
import { vibeTrackKey, type ArtistTarget, type CardItem, type VibeTrack } from "@/model/vibe";
import { isVibeTrackLiked } from "./likes";

export type MenuItem = {
  label?: LocalizedText;
  icon?: IconName;
  accent?: boolean;
  sep?: boolean;
  danger?: boolean;
  hint?: string;
  onClick?: () => void;
};

export type MenuState = {
  x: number;
  y: number;
  items: MenuItem[];
} | null;

type OptionalMenuItem = MenuItem | boolean | null | undefined;

export function isMenuItem(item: OptionalMenuItem): item is MenuItem {
  return typeof item === "object" && item !== null;
}

export function artistMenuItem(
  openArtist: (ar: ArtistTarget) => void,
  id: string | undefined,
  name: string | undefined,
): MenuItem | null {
  return id
    ? {
        label: { key: "menu.goToArtist" },
        icon: "user",
        onClick: () => openArtist({ id, name: name ?? "" }),
      }
    : null;
}

export function trackMenuItems(opts: {
  track: VibeTrack;
  onPlay: (track: VibeTrack) => void;
  enqueue: (trackId: string, next?: boolean) => void;
  toggleLike: (track: VibeTrack) => void;
  liked: ReadonlySet<string>;
  openArtist: (ar: ArtistTarget) => void;
}): MenuItem[] {
  const { track, onPlay, enqueue, toggleLike, liked, openArtist } = opts;
  const likedTrack = vibeTrackKey(track);
  const items: OptionalMenuItem[] = [
    { label: { key: "menu.play" }, icon: "play", accent: true, onClick: () => onPlay(track) },
    {
      label: { key: "menu.playNext" },
      icon: "next",
      onClick: () => likedTrack && enqueue(likedTrack, true),
    },
    {
      label: { key: "menu.addToQueue" },
      icon: "list",
      onClick: () => likedTrack && enqueue(likedTrack),
    },
    { sep: true },
    {
      label: {
        key: isVibeTrackLiked(liked, track) ? "menu.removeFromLiked" : "menu.addToLiked",
      },
      icon: "heart",
      onClick: () => toggleLike(track),
    },
    artistMenuItem(openArtist, track.artistId, track.artist),
  ];
  return items.filter(isMenuItem);
}

export function collectionMenuItems(opts: {
  item: CardItem;
  openDetail: (item: CardItem) => void;
  openArtist: (ar: ArtistTarget) => void;
}): MenuItem[] {
  const { item, openDetail, openArtist } = opts;
  const items: OptionalMenuItem[] = [
    { label: { key: "menu.open" }, icon: "play", accent: true, onClick: () => openDetail(item) },
    artistMenuItem(openArtist, item.artistId, item.artist),
  ];
  return items.filter(isMenuItem);
}

/**
 * The app menu's whole input: which entries apply, and where each one goes.
 * Named because the shell hook that opens the menu carries the same nine values
 * straight through — a contract, not nine props to spell out again at each stop.
 */
export type AppMenuBindings = {
  canGoBack: boolean;
  hasQueue: boolean;
  goBack: () => void;
  goHome: () => void;
  openSearch: () => void;
  openLibrary: () => void;
  openQueue: () => void;
  openProfile: () => void;
  openSettings: () => void;
};

export function appMenuItems(opts: AppMenuBindings): MenuItem[] {
  const items: OptionalMenuItem[] = [
    opts.canGoBack && { label: { key: "menu.back" }, icon: "back", onClick: opts.goBack },
    { label: { key: "menu.home" }, icon: "compass", onClick: opts.goHome },
    { sep: true },
    { label: { key: "menu.search" }, icon: "search", accent: true, onClick: opts.openSearch },
    { label: { key: "menu.library" }, icon: "stack", onClick: opts.openLibrary },
    opts.hasQueue && { label: { key: "menu.queue" }, icon: "list", onClick: opts.openQueue },
    { sep: true },
    { label: { key: "menu.profile" }, icon: "user", onClick: opts.openProfile },
    { label: { key: "menu.settings" }, icon: "gear", onClick: opts.openSettings },
  ];
  return items.filter(isMenuItem);
}
