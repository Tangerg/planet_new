// ============================================================
// Library — your collections, as grid · list · cover-flow, plus a songs tab.
// Grid/list/songs are windowed (VirtualGrid / VirtualList via CardGrid / VList).
// ============================================================
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  CollectionViewMode,
  LibrarySectionTab,
  ScreenData,
  TrackListBindings,
  VibeCollection,
} from "@/model/vibe";
import { collectionFlowItems, collectionMeta, collectionSub } from "@/model/derive";
import {
  LIBRARY_INITIAL_FLOW_CENTER,
  libraryScreenModel,
  libraryTracksForCollection,
} from "@/model/library";
import { clampIndex } from "@shared/number";
import { localize, localizeJoined } from "@/i18n/text";
import { ToggleGroup } from "@/components/controls/ToggleGroup";
import { ViewToggle } from "@/components/ViewToggle";
import { MediaCard } from "@/components/cards/MediaCard";
import { CollectionRow } from "@/components/cards/CollectionRow";
import { TrackRow } from "@/components/cards/TrackRow";
import { CardGrid } from "@/components/layout/CardGrid";
import { VList } from "@/components/layout/VList";
import { ScrollProvider } from "@/components/layout/ScrollContext";
import { PageColumn } from "@/components/layout/PageColumn";
import { CoverFlow } from "@/components/CoverFlow";
import { FadeIn, XFade } from "@/components/motion";
import { firstPlayableCollectionTrack } from "@/model/track-actions";

type LibraryScreenProps = TrackListBindings & {
  data: ScreenData;
  onOpenPlaylist: (p: VibeCollection) => void;
  onOpenAlbum: (a: VibeCollection) => void;
  // Controlled by Shell so the active tab/view survives a back-navigation round-trip.
  tab: LibrarySectionTab;
  view: CollectionViewMode;
  onTab: (t: LibrarySectionTab) => void;
  onView: (v: CollectionViewMode) => void;
};

export function LibraryScreen({
  data,
  onPlay,
  current,
  playing,
  onOpenPlaylist,
  onOpenAlbum,
  onOpenArtist,
  liked,
  toggleLike,
  tab,
  view,
  onTab,
  onView,
}: LibraryScreenProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [flowCenter, setFlowCenter] = useState(LIBRARY_INITIAL_FLOW_CENTER);
  // Recentre the flow per collection. Adjusted during render rather than in an
  // effect: an effect would paint one frame of the new tab still centered on the
  // old index (often out of range) before correcting it.
  const [flowTab, setFlowTab] = useState(tab);
  if (flowTab !== tab) {
    setFlowTab(tab);
    setFlowCenter(LIBRARY_INITIAL_FLOW_CENTER);
  }
  const model = useMemo(() => libraryScreenModel(data, tab, view), [data, tab, view]);
  const { cardTab, collections, flowMode, round, songColumns, tabs, tracks } = model;
  // Every callback below lands on the memoized MediaCard / CollectionRow, whose
  // whole point is that the windowed grid/list re-invokes renderItem for all
  // visible cells on each scroll tick. A fresh closure per render would fail the
  // shallow compare and re-render the entire visible set — so they are stable.
  const collectionSubtitle = useCallback(
    (collection: VibeCollection) => localize(t, collectionSub(collection, tab)),
    [t, tab],
  );
  const collectionMetaLabel = useCallback(
    (collection: VibeCollection) => localizeJoined(t, collectionMeta(collection, tab)),
    [t, tab],
  );
  const flowItems = useMemo(
    () => collectionFlowItems(collections, collectionSubtitle),
    [collections, collectionSubtitle],
  );
  const openOf = useCallback(
    (o: VibeCollection) =>
      model.collectionRoute === "album"
        ? onOpenAlbum(o)
        : model.collectionRoute === "artist"
          ? onOpenArtist(o)
          : onOpenPlaylist(o),
    [model.collectionRoute, onOpenAlbum, onOpenArtist, onOpenPlaylist],
  );
  // Library resolves a collection's tracks per active tab (they're lazy on the
  // object), so it can't use the shared collection.tracks-based useCollectionPlayback
  // — it plays over the resolved list instead.
  const tracksOf = useCallback(
    (o: VibeCollection) => libraryTracksForCollection(tab, tracks, o),
    [tab, tracks],
  );
  const firstPlayable = useCallback(
    (o: VibeCollection) => firstPlayableCollectionTrack({ tracks: tracksOf(o) }),
    [tracksOf],
  );
  const playCollection = useCallback(
    (collection: VibeCollection) => {
      const track = firstPlayable(collection);
      if (track) onPlay(track);
    },
    [firstPlayable, onPlay],
  );
  const canPlayCollection = useCallback(
    (collection: VibeCollection) => Boolean(firstPlayable(collection)),
    [firstPlayable],
  );

  return (
    <FadeIn
      ref={scrollRef}
      className={`${flowMode ? "" : "scroll "}flex h-full flex-col`}
      style={{
        overflow: flowMode ? "hidden" : undefined,
        background: "radial-gradient(120% 80% at 70% -5%, #15161d, var(--surf-0))",
      }}
    >
      <ScrollProvider value={scrollRef}>
        <PageColumn
          className="flex min-h-0 flex-col"
          style={{
            paddingTop: 60,
            paddingBottom: flowMode ? 0 : 40,
            flex: flowMode ? "0 0 auto" : 1,
          }}
        >
          <div className="mb-[22px] text-[36px] font-extralight">{t("library.title")}</div>
          <div className="tabs mb-[30px]">
            <ToggleGroup
              ariaLabel={t("library.section")}
              className="tabgroup"
              itemClassName="tab"
              value={tab}
              onValueChange={onTab}
              items={tabs.map((it) => ({ value: it.value, label: localize(t, it.label) }))}
            />
            {cardTab && (
              <ViewToggle
                value={view}
                onChange={onView}
                style={{ marginLeft: "auto", transform: "translateY(-8px)" }}
              />
            )}
          </div>

          <XFade
            key={tab + view}
            style={
              flowMode
                ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }
                : undefined
            }
          >
            {cardTab && view === "flow" && (
              <div className="-mx-12 min-h-0 flex-1">
                <CoverFlow
                  items={flowItems}
                  round={round}
                  center={clampIndex(flowCenter, flowItems.length)}
                  setCenter={setFlowCenter}
                  onOpen={openOf}
                  onPlay={playCollection}
                  canPlay={canPlayCollection}
                  tracksFor={tracksOf}
                  onPlayTrack={onPlay}
                />
              </div>
            )}
            {cardTab && view === "grid" && (
              <CardGrid
                count={collections.length}
                minColumnWidth={176}
                gap={24}
                estimateRowHeight={240}
                itemKey={(i) => collections[i].id}
                renderItem={(i) => {
                  const o = collections[i];
                  return (
                    <MediaCard
                      item={o}
                      round={round}
                      sub={collectionSubtitle(o)}
                      onOpen={openOf}
                      onPlay={playCollection}
                      playable={tab !== "artists" && canPlayCollection(o)}
                    />
                  );
                }}
              />
            )}
            {cardTab && view === "list" && (
              <VList
                count={collections.length}
                estimateSize={66}
                itemKey={(i) => collections[i].id}
                renderItem={(i) => {
                  const o = collections[i];
                  return (
                    <CollectionRow
                      item={o}
                      round={round}
                      sub={collectionSubtitle(o)}
                      meta={collectionMetaLabel(o)}
                      onOpen={openOf}
                      onPlay={playCollection}
                      playable={tab !== "artists" && canPlayCollection(o)}
                    />
                  );
                }}
              />
            )}
            {tab === "songs" && (
              <div className="grid grid-cols-2 gap-x-10">
                {songColumns.map((column, side) => (
                  <VList
                    key={side}
                    count={column.tracks.length}
                    estimateSize={66}
                    itemKey={(i) => column.tracks[i].id}
                    renderItem={(i) => (
                      <TrackRow
                        track={column.tracks[i]}
                        index={column.startIndex + i + 1}
                        onPlay={onPlay}
                        current={current}
                        playing={playing}
                        liked={liked}
                        toggleLike={toggleLike}
                        onOpenArtist={onOpenArtist}
                      />
                    )}
                  />
                ))}
              </div>
            )}
          </XFade>
        </PageColumn>
      </ScrollProvider>
    </FadeIn>
  );
}
