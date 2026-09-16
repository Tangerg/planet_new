import type React from "react";
import { useCallback, useMemo, useRef, useState } from "react";

import type { CollectionViewMode, VibeTrack } from "@/model/vibe";
import { sortTracks, type SortMode } from "@/model/derive";
import {
  detailSelectedTracks,
  detailSelectionOrderIds,
  firstDetailSelectedTrack,
  nextDetailSelection,
} from "@/model/detail";
import { vibeTrackKey } from "@/model/vibe";
import { useScreenActions } from "@/hooks/screenActions";

const HERO = 380;

export function useDetailScreenModel(
  tracks: VibeTrack[],
  onPlay: (track: VibeTrack) => void,
  onShufflePlay: (tracks: VibeTrack[]) => void,
) {
  const { enqueue } = useScreenActions();
  const [view, setView] = useState<CollectionViewMode>("list");
  const [sort, setSort] = useState<SortMode>("order");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const lastSel = useRef<string | null>(null);
  const [flowCenter, setFlowCenter] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => sortTracks(tracks, sort), [tracks, sort]);
  const selectionOrderIds = useMemo(() => detailSelectionOrderIds(sorted), [sorted]);

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
