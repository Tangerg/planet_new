import type { ArtistTarget, CardItem, VibeTrack } from "@/model/vibe";

export type MenuItem = {
  label?: string;
  icon?: string;
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
    ? { label: "Go to artist", icon: "user", onClick: () => openArtist({ id, name: name ?? "" }) }
    : null;
}

export function trackMenuItems(opts: {
  track: VibeTrack;
  onPlay: (track: VibeTrack) => void;
  enqueue: (trackId: string, next?: boolean) => void;
  toggleLike: (id: string) => void;
  liked: ReadonlySet<string>;
  openArtist: (ar: ArtistTarget) => void;
}): MenuItem[] {
  const { track, onPlay, enqueue, toggleLike, liked, openArtist } = opts;
  const items: OptionalMenuItem[] = [
    { label: "Play", icon: "play", accent: true, onClick: () => onPlay(track) },
    { label: "Play Next", icon: "next", onClick: () => enqueue(track.id, true) },
    { label: "Add to Queue", icon: "list", onClick: () => enqueue(track.id) },
    { sep: true },
    {
      label: liked.has(track.id) ? "Remove from Liked" : "Add to Liked",
      icon: "heart",
      onClick: () => toggleLike(track.id),
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
    { label: "Open", icon: "play", accent: true, onClick: () => openDetail(item) },
    artistMenuItem(openArtist, item.artistId, item.artist),
  ];
  return items.filter(isMenuItem);
}

export function appMenuItems(opts: {
  canGoBack: boolean;
  hasQueue: boolean;
  goBack: () => void;
  goHome: () => void;
  openSearch: () => void;
  openLibrary: () => void;
  openQueue: () => void;
  openProfile: () => void;
  openSettings: () => void;
}): MenuItem[] {
  const items: OptionalMenuItem[] = [
    opts.canGoBack && { label: "Back", icon: "back", onClick: opts.goBack },
    { label: "Home", icon: "compass", onClick: opts.goHome },
    { sep: true },
    { label: "Search", icon: "search", accent: true, onClick: opts.openSearch },
    { label: "Library", icon: "stack", onClick: opts.openLibrary },
    opts.hasQueue && { label: "Queue", icon: "list", onClick: opts.openQueue },
    { sep: true },
    { label: "Profile", icon: "user", onClick: opts.openProfile },
    { label: "Settings", icon: "gear", onClick: opts.openSettings },
  ];
  return items.filter(isMenuItem);
}
