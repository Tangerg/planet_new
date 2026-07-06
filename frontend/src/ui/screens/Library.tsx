// ============================================================
// Library — your collections, as grid · list · cover-flow, plus a songs tab.
// Grid/list/songs are windowed (VirtualGrid / VirtualList via CardGrid / VList).
// ============================================================
import React, { useRef, useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ArtistRef, ScreenData, VibeTrack, VibeCollection } from "@/model/vibe";
import { collectionSub, collectionTrackCount } from "@/model/derive";
import {
  LIBRARY_INITIAL_FLOW_CENTER,
  libraryScreenModel,
  libraryTracksForCollection,
} from "@/model/library";
import { clampFlowCenter } from "@/model/flow";
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

type LibraryScreenProps = {
  data: ScreenData;
  onPlay: (track: VibeTrack) => void;
  current?: VibeTrack;
  playing: boolean;
  accent: string;
  openPlaylist: (p: VibeCollection) => void;
  openAlbum: (a: VibeCollection) => void;
  openArtist: (artist: ArtistRef) => void;
  liked: Set<string>;
  toggleLike: (id: string) => void;
  // Controlled by Shell so the active tab/view survives a back-navigation round-trip.
  tab: string;
  view: string;
  onTab: (t: string) => void;
  onView: (v: string) => void;
};

export function LibraryScreen({
  data,
  onPlay,
  current,
  playing,
  accent,
  openPlaylist,
  openAlbum,
  openArtist,
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
  useEffect(() => {
    setFlowCenter(LIBRARY_INITIAL_FLOW_CENTER);
  }, [tab]); // recentre the flow per collection
  const model = useMemo(() => libraryScreenModel(data, tab, view), [data, tab, view]);
  const { cardTab, collections, flowItems, flowMode, round, songColumns, tabs, tracks } = model;
  const tabLabels: Record<string, string> = {
    albums: t("common.albums"),
    artists: t("common.artists"),
    playlists: t("common.playlists"),
    songs: t("common.songs"),
  };
  const collectionSubtitle = (collection: VibeCollection) => {
    if (tab === "playlists") return t("common.playlist");
    return collectionSub(collection, tab);
  };
  const collectionMetaLabel = (collection: VibeCollection) => {
    const count = t("counts.tracks", { count: collectionTrackCount(collection) });
    if (tab === "albums") return [collection.year, count].filter(Boolean).join(" · ");
    if (tab === "artists") return "";
    return count;
  };
  const localizedFlowItems = flowItems.map((item) => ({
    ...item,
    sub: collectionSubtitle(item.obj),
  }));
  const openOf = (o: VibeCollection) =>
    model.collectionRoute === "album"
      ? openAlbum(o)
      : model.collectionRoute === "artist"
        ? openArtist(o)
        : openPlaylist(o);
  // Library resolves a collection's tracks per active tab (they're lazy on the
  // object), so it can't use the shared collection.tracks-based useCollectionPlayback
  // — it plays over the resolved list instead.
  const tracksOf = (o: VibeCollection) => libraryTracksForCollection(tab, tracks, o);
  const firstPlayable = (o: VibeCollection) =>
    firstPlayableCollectionTrack({ tracks: tracksOf(o) });
  const playCollection = (collection: VibeCollection) => {
    const track = firstPlayable(collection);
    if (track) onPlay(track);
  };
  const canPlayCollection = (collection: VibeCollection) => Boolean(firstPlayable(collection));

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
              items={tabs.map((it) => ({ ...it, label: tabLabels[it.value] ?? it.label }))}
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
                  items={localizedFlowItems}
                  round={round}
                  center={clampFlowCenter(flowCenter, flowItems.length)}
                  setCenter={setFlowCenter}
                  accent={accent}
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
                <VList
                  count={songColumns.left.length}
                  estimateSize={66}
                  itemKey={(i) => songColumns.left[i].id}
                  renderItem={(i) => (
                    <TrackRow
                      track={songColumns.left[i]}
                      index={i + 1}
                      onPlay={onPlay}
                      current={current}
                      playing={playing}
                      liked={liked}
                      toggleLike={toggleLike}
                      accent={accent}
                      onOpenArtist={openArtist}
                    />
                  )}
                />
                <VList
                  count={songColumns.right.length}
                  estimateSize={66}
                  itemKey={(i) => songColumns.right[i].id}
                  renderItem={(i) => (
                    <TrackRow
                      track={songColumns.right[i]}
                      index={songColumns.split + i + 1}
                      onPlay={onPlay}
                      current={current}
                      playing={playing}
                      liked={liked}
                      toggleLike={toggleLike}
                      accent={accent}
                      onOpenArtist={openArtist}
                    />
                  )}
                />
              </div>
            )}
          </XFade>
        </PageColumn>
      </ScrollProvider>
    </FadeIn>
  );
}
