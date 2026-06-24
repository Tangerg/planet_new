/**
 * Right-click context menu state + helpers. Extracted from Shell.tsx.
 * Sets global handlers (window.__TRACKMENU / __COLLMENU / __ENQUEUE) that
 * deeply nested screens call without prop drilling.
 */
import { useEffect, useState } from "react";

import type { VibeTrack, VibeCollection } from "./adapt";

type MenuItem = {
  label?: string;
  icon?: string;
  accent?: boolean;
  sep?: boolean;
  onClick?: () => void;
};

type MenuState = {
  x: number;
  y: number;
  items: MenuItem[];
} | null;

export function useContextMenu(opts: {
  onPlay: (track: VibeTrack | undefined) => void;
  openDetail: (item: VibeCollection) => void;
  openArtist: (ar: any) => void;
  toggleLike: (id: string) => void;
  liked: Set<string>;
}) {
  const { onPlay, openDetail, openArtist, toggleLike, liked } = opts;
  const [menu, setMenu] = useState<MenuState>(null);

  const openMenu = (
    e: {
      preventDefault: () => void;
      stopPropagation: () => void;
      clientX: number;
      clientY: number;
    },
    items: MenuItem[],
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  };

  const trackMenu = (track: any): MenuItem[] =>
    [
      { label: "Play", icon: "play", accent: true, onClick: () => onPlay(track) },
      { sep: true },
      {
        label: liked.has(track.id) ? "Remove from Liked" : "Add to Liked",
        icon: "heart",
        onClick: () => toggleLike(track.id),
      },
      track.artistId && {
        label: "Go to artist",
        icon: "user",
        onClick: () => openArtist({ id: track.artistId, name: track.artist }),
      },
    ].filter(Boolean) as MenuItem[];

  const collMenu = (item: any): MenuItem[] =>
    [
      { label: "Open", icon: "play", accent: true, onClick: () => openDetail(item) },
      item.artistId && {
        label: "Go to artist",
        icon: "user",
        onClick: () => openArtist({ id: item.artistId, name: item.artist }),
      },
    ].filter(Boolean) as MenuItem[];

  useEffect(() => {
    window.__TRACKMENU = (e, track) => openMenu(e, trackMenu(track));
    window.__COLLMENU = (e, item) => openMenu(e, collMenu(item));
    window.__ENQUEUE = () => {};
    return () => {
      window.__TRACKMENU = undefined;
      window.__COLLMENU = undefined;
      window.__ENQUEUE = undefined;
    };
  });

  return { menu, setMenu };
}
