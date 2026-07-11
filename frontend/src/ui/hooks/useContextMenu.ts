/**
 * Right-click context menu state + the screen-action handlers (track/collection
 * menu + enqueue). Returns them as stable callbacks; the Shell hands them to the
 * ScreenActionsProvider so deeply-nested screens reach them via useScreenActions
 * (no prop-drilling, no window globals).
 */
import { useCallback, useMemo, useRef, useState } from "react";

import type { ArtistTarget, CardItem, VibeTrack } from "@/model/vibe";
import type { ScreenActions } from "@/hooks/screenActions";
import { collectionMenuItems, trackMenuItems, type MenuState } from "@/model/menu";

export function useContextMenu(opts: {
  onPlay: (track: VibeTrack | undefined) => void;
  enqueue: (trackId: string, next?: boolean) => void;
  openDetail: (item: CardItem) => void;
  openArtist: (ar: ArtistTarget) => void;
  toggleLike: (track: VibeTrack) => void;
  liked: Set<string>;
}) {
  const [menu, setMenu] = useState<MenuState>(null);

  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Stable handlers (read latest opts via ref) so the provider value never churns.
  const trackMenu = useCallback<ScreenActions["trackMenu"]>((e, track, options) => {
    const { onPlay, enqueue, toggleLike, liked, openArtist } = optsRef.current;
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: trackMenuItems({
        track,
        onPlay: options?.onPlay ?? onPlay,
        enqueue,
        toggleLike,
        liked,
        openArtist,
      }),
    });
  }, []);

  const collMenu = useCallback<ScreenActions["collMenu"]>((e, item) => {
    const { openDetail, openArtist } = optsRef.current;
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: collectionMenuItems({ item, openDetail, openArtist }),
    });
  }, []);

  const enqueue = useCallback<ScreenActions["enqueue"]>((trackId, next) => {
    optsRef.current.enqueue(trackId, next);
  }, []);

  const actions = useMemo<ScreenActions>(
    () => ({ trackMenu, collMenu, enqueue }),
    [trackMenu, collMenu, enqueue],
  );

  return { menu, setMenu, actions };
}
