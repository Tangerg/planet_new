import type React from "react";

import { clampIndex } from "@shared/number";

import type { CollectionViewMode, TrackListBindings, VibeTrack } from "@/model/vibe";
import { trackFlowItems } from "@/model/derive";
import { CoverFlow } from "@/components/CoverFlow";
import { TrackRow, TRACK_ROW_HEIGHT } from "@/components/cards/TrackRow";
import { TrackCard, TRACK_CARD_ROW_HEIGHT } from "@/components/cards/TrackCard";
import { CardGrid } from "@/components/layout/CardGrid";
import { VList } from "@/components/layout/VList";

export function TrackCollectionView({
  view,
  tracks,
  listRows,
  flowCenter,
  setFlowCenter,
  flowHeight,
  rankFor,
  selected,
  onSelect,
  ...trackList
}: TrackListBindings & {
  view: CollectionViewMode;
  tracks: VibeTrack[];
  listRows?: { t: VibeTrack; i: number }[];
  flowCenter: number;
  setFlowCenter: (n: number | ((c: number) => number)) => void;
  flowHeight: number;
  rankFor?: (track: VibeTrack, i: number) => number | undefined;
  selected?: Set<string>;
  onSelect?: (track: VibeTrack, e: React.MouseEvent) => void;
}) {
  const { onPlay, onOpenArtist } = trackList;
  if (view === "list") {
    const rows = listRows ?? tracks.map((t, i) => ({ t, i }));
    return (
      <VList
        count={rows.length}
        estimateSize={TRACK_ROW_HEIGHT}
        itemKey={(vi) => rows[vi].t.id}
        renderItem={(vi) => {
          const { t, i } = rows[vi];
          return (
            <TrackRow
              track={t}
              index={i + 1}
              rank={rankFor?.(t, i)}
              selected={selected?.has(t.id)}
              onSelect={onSelect}
              {...trackList}
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
        estimateRowHeight={TRACK_CARD_ROW_HEIGHT}
        itemKey={(i) => tracks[i].id}
        renderItem={(i) => (
          <TrackCard track={tracks[i]} onPlay={onPlay} onOpenArtist={onOpenArtist} />
        )}
      />
    );
  }
  return (
    <div className="-mx-12" style={{ height: flowHeight }}>
      <CoverFlow
        items={trackFlowItems(tracks)}
        center={clampIndex(flowCenter, tracks.length)}
        setCenter={setFlowCenter}
        onOpen={onPlay}
        onPlay={onPlay}
      />
    </div>
  );
}
