import type React from "react";
import { useCallback, useMemo, useRef, useState } from "react";

import type { VibeTrack } from "@/model/vibe";
import { sortTracks, type SortMode } from "@/model/derive";
import {
  detailSelectedTracks,
  detailSelectionOrderIds,
  firstDetailSelectedTrack,
  nextDetailSelection,
} from "@/model/detail";
import { vibeTrackKey } from "@/model/vibe";
import { useScreenActions } from "@/hooks/screenActions";

/** Hero band height; also the scroll offset that reveals the condensed header. */
const HERO = 380;

/**
 * Behavior for the playlist/album/chart Detail screen: view mode, track sorting,
 * shift-range multi-selection, the selection action bar, and the scroll-driven
 * condensed header. Extracting it keeps the screen as declarative layout and
 * makes the fiddly range-select math live next to (and testable with) the rest
 * of the derivation layer.
 */
export function useDetailScreenModel(
  tracks: VibeTrack[],
  onPlay: (track: VibeTrack) => void,
  onShufflePlay: (tracks: VibeTrack[]) => void,
) {
  const { enqueue } = useScreenActions();
  const [view, setView] = useState("list"); // list | grid | flow
  const [sort, setSort] = useState<SortMode>("order");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const lastSel = useRef<string | null>(null);
  const [flowCenter, setFlowCenter] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => sortTracks(tracks, sort), [tracks, sort]);
  const selectionOrderIds = useMemo(() => detailSelectionOrderIds(sorted), [sorted]);

  // Shift-click extends the selection across the *sorted* range from the anchor.
  // Stable identity (only the sorted order is a real dep) so it can be the
  // onSelect of memoized rows — selecting a track then re-renders just the two
  // affected rows, not the whole visible list.
  const toggleSel = useCallback(
    (track: VibeTrack, e: React.MouseEvent) => {
      setSel((prev) =>
        nextDetailSelection({
          anchorId: lastSel.current,
          extendRange: e.shiftKey,
          orderedIds: selectionOrderIds,
          selected: prev,
          trackId: track.id,
        }),
      );
      lastSel.current = track.id;
    },
    [selectionOrderIds],
  );

  const clearSel = () => setSel(new Set());

  // Sticky condensed header: reveal once the hero has scrolled mostly past.
  // Written imperatively so a scroll tick never re-renders the track list.
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bar = stickyRef.current;
    if (!bar) return;
    const on = (e.target as HTMLDivElement).scrollTop > HERO - 120;
    bar.style.opacity = on ? "1" : "0";
    bar.style.transform = on ? "translateY(0)" : "translateY(-100%)";
    bar.style.pointerEvents = on ? "auto" : "none";
  };

  const hasTracks = tracks.length > 0;
  const playFirst = () => {
    if (hasTracks) onPlay(tracks[0]);
  };
  const shuffleAll = () => {
    if (hasTracks) onShufflePlay(tracks);
  };
  const enqueueSelected = () => {
    detailSelectedTracks(tracks, sel).forEach((track) => {
      const key = vibeTrackKey(track);
      if (key) enqueue(key);
    });
    clearSel();
  };
  const playSelected = () => {
    const first = firstDetailSelectedTrack(tracks, sel);
    if (first) onPlay(first);
    clearSel();
  };

  return {
    heroHeight: HERO,
    view,
    setView,
    sort,
    setSort,
    sorted,
    sel,
    toggleSel,
    clearSel,
    flowCenter,
    setFlowCenter,
    scrollRef,
    stickyRef,
    handleScroll,
    hasTracks,
    playFirst,
    shuffleAll,
    enqueueSelected,
    playSelected,
  };
}
