import type React from "react";
import { useMemo, useRef, useState } from "react";

import type { VibeTrack } from "@/model/adapt";
import { sortTracks, type SortMode } from "@/model/derive";
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

  // Shift-click extends the selection across the *sorted* range from the anchor.
  const toggleSel = (track: VibeTrack, e: React.MouseEvent) => {
    setSel((prev) => {
      const n = new Set(prev);
      if (e.shiftKey && lastSel.current != null) {
        const ids = sorted.map((s) => s.t.id);
        const a = ids.indexOf(lastSel.current);
        const b = ids.indexOf(track.id);
        if (a > -1 && b > -1) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          for (let k = lo; k <= hi; k++) n.add(ids[k]);
        }
      } else if (n.has(track.id)) {
        n.delete(track.id);
      } else {
        n.add(track.id);
      }
      return n;
    });
    lastSel.current = track.id;
  };

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
    tracks.filter((t) => sel.has(t.id)).forEach((t) => enqueue(t.id));
    clearSel();
  };
  const playSelected = () => {
    const first = tracks.find((t) => sel.has(t.id));
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
