import type React from "react";

import type { ArtistRef, VibeTrack } from "@/model/adapt";
import { trackFlowItems } from "@/model/derive";
import { CoverFlow } from "@/components/CoverFlow";
import { TrackRow } from "@/components/cards/TrackRow";
import { TrackCard } from "@/components/cards/TrackCard";
import { CardGrid } from "@/components/layout/CardGrid";
import { VList } from "@/components/layout/VList";

/**
 * A track collection rendered as list / grid / flow — the shared middle of the
 * Detail and Artist screens. A dumb renderer: sort order, multi-select, and
 * chart rank stay in the owning screen and arrive as optional props, so Detail
 * gets its richer list while Artist passes none of them. The caller keeps the
 * crossfade (XFade) around this, since its keying differs per screen.
 */
export function TrackCollectionView({
  view,
  tracks,
  listRows,
  onPlay,
  current,
  playing,
  liked,
  toggleLike,
  accent,
  onOpenArtist,
  flowCenter,
  setFlowCenter,
  flowHeight,
  rankFor,
  deltaFor,
  selected,
  onSelect,
}: {
  view: string; // list | grid | flow
  /** Grid + flow source, in natural order. */
  tracks: VibeTrack[];
  /** List source (Detail passes its sorted rows); defaults to `tracks` in order. */
  listRows?: { t: VibeTrack; i: number }[];
  onPlay: (track: VibeTrack) => void;
  current?: VibeTrack;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (id: string) => void;
  accent: string;
  onOpenArtist?: (artist: ArtistRef) => void;
  flowCenter: number;
  setFlowCenter: (n: number | ((c: number) => number)) => void;
  flowHeight: number;
  rankFor?: (track: VibeTrack, i: number) => number | undefined;
  deltaFor?: (track: VibeTrack, i: number) => number | undefined;
  selected?: Set<string>;
  onSelect?: (track: VibeTrack, e: React.MouseEvent) => void;
}) {
  if (view === "list") {
    const rows = listRows ?? tracks.map((t, i) => ({ t, i }));
    return (
      <VList
        count={rows.length}
        estimateSize={66}
        itemKey={(vi) => rows[vi].t.id}
        renderItem={(vi) => {
          const { t, i } = rows[vi];
          return (
            <TrackRow
              track={t}
              index={i + 1}
              rank={rankFor?.(t, i)}
              delta={deltaFor?.(t, i)}
              onPlay={onPlay}
              current={current}
              selected={selected?.has(t.id)}
              onSelect={onSelect}
              playing={playing}
              liked={liked}
              toggleLike={toggleLike}
              accent={accent}
              onOpenArtist={onOpenArtist}
            />
          );
        }}
      />
    );
  }
  if (view === "grid") {
    return (
      <CardGrid
        count={tracks.length}
        minColumnWidth={168}
        gap={26}
        estimateRowHeight={232}
        itemKey={(i) => tracks[i].id}
        renderItem={(i) => (
          <TrackCard
            track={tracks[i]}
            onPlay={onPlay}
            accent={accent}
            onOpenArtist={onOpenArtist}
          />
        )}
      />
    );
  }
  return (
    <div className="-mx-12" style={{ height: flowHeight }}>
      <CoverFlow
        items={trackFlowItems(tracks)}
        center={Math.min(flowCenter, tracks.length - 1)}
        setCenter={setFlowCenter}
        accent={accent}
        onOpen={onPlay}
        onPlay={onPlay}
      />
    </div>
  );
}
