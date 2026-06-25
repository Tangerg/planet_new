/**
 * Right-click context menu state + the screen-action handlers (track/collection
 * menu + enqueue). Returns them as stable callbacks; the Shell hands them to the
 * ScreenActionsProvider so deeply-nested screens reach them via useScreenActions
 * (no prop-drilling, no window globals).
 */
import { useCallback, useMemo, useRef, useState } from "react";

import type { VibeTrack, VibeCollection } from "./adapt";
import type { ScreenActions } from "./screenActions";

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
  const [menu, setMenu] = useState<MenuState>(null);

  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Stable handlers (read latest opts via ref) so the provider value never churns.
  const trackMenu = useCallback<ScreenActions["trackMenu"]>((e, track) => {
    const { onPlay, toggleLike, liked, openArtist } = optsRef.current;
    e.preventDefault();
    e.stopPropagation();
    const items: MenuItem[] = [
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
    setMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  const collMenu = useCallback<ScreenActions["collMenu"]>((e, item) => {
    const { openDetail, openArtist } = optsRef.current;
    e.preventDefault();
    e.stopPropagation();
    const items: MenuItem[] = [
      { label: "Open", icon: "play", accent: true, onClick: () => openDetail(item) },
      item.artistId && {
        label: "Go to artist",
        icon: "user",
        onClick: () => openArtist({ id: item.artistId, name: item.artist }),
      },
    ].filter(Boolean) as MenuItem[];
    setMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  // Enqueue is not wired to the kernel queue yet — placeholder, as before.
  const enqueue = useCallback<ScreenActions["enqueue"]>(() => {}, []);

  const actions = useMemo<ScreenActions>(
    () => ({ trackMenu, collMenu, enqueue }),
    [trackMenu, collMenu, enqueue],
  );

  return { menu, setMenu, actions };
}
