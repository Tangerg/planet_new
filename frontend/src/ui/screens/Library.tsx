// ============================================================
// Library — your collections, as grid · list · cover-flow, plus a songs tab.
// Grid/list/songs are windowed (VirtualGrid / VirtualList via CardGrid / VList).
// ============================================================
import React, { useRef, useState, useEffect } from "react";
import type { ArtistRef, ScreenData, VibeTrack, VibeCollection } from "@/model/adapt";
import { collectionSub, collectionMeta, collectionFlowItems, type FlowItem } from "@/model/derive";
import { ToggleGroup } from "@/components/controls/ToggleGroup";
import { ViewToggle } from "@/components/ViewToggle";
import { MediaCard } from "@/components/cards/MediaCard";
import { CollectionRow } from "@/components/cards/CollectionRow";
import { TrackRow } from "@/components/cards/TrackRow";
import { CardGrid } from "@/components/layout/CardGrid";
import { VList } from "@/components/layout/VList";
import { ScrollProvider } from "@/components/layout/ScrollContext";
import { CoverFlow } from "@/components/CoverFlow";
import { FadeIn, XFade } from "@/components/motion";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [flowCenter, setFlowCenter] = useState(2);
  useEffect(() => {
    setFlowCenter(2);
  }, [tab]); // recentre the flow per collection
  const tracks = data.allTracks;
  const half = Math.ceil(tracks.length / 2);
  const cardTab = tab === "playlists" || tab === "albums" || tab === "artists";

  // the active collection, normalised so grid / list / flow share one source
  // Artists are read through the unified collection shape (cover fields only);
  // the screen never touches collection-specific fields on the artist branch.
  const coll: VibeCollection[] =
    tab === "albums"
      ? data.albums
      : tab === "artists"
        ? (data.artists as unknown as VibeCollection[])
        : data.playlists;
  const openOf = (o: VibeCollection) =>
    tab === "albums" ? openAlbum(o) : tab === "artists" ? openArtist(o) : openPlaylist(o);
  const tracksOf = (o: VibeCollection) =>
    tab === "artists" ? tracks.filter((t) => t.artistId === o.id) : o.tracks || [];
  const round = tab === "artists";
  const flowItems = collectionFlowItems(coll, (o) => collectionSub(o, tab));

  const flowMode = cardTab && view === "flow";
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
        <div
          className="flex min-h-0 flex-col"
          style={{
            padding: flowMode ? "60px 48px 0" : "60px 48px 40px",
            flex: flowMode ? "0 0 auto" : "1",
          }}
        >
          <div className="mb-[22px] text-[36px] font-extralight">Your Library</div>
          <div className="tabs mb-[30px]">
            <ToggleGroup
              ariaLabel="Library section"
              className="tabgroup"
              itemClassName="tab"
              value={tab}
              onValueChange={onTab}
              items={[
                { value: "playlists", label: "Playlists" },
                { value: "albums", label: "Albums" },
                { value: "artists", label: "Artists" },
                { value: "songs", label: "Songs" },
              ]}
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
                  center={Math.min(flowCenter, flowItems.length - 1)}
                  setCenter={setFlowCenter}
                  accent={accent}
                  onOpen={(it: FlowItem) => openOf(it.obj as VibeCollection)}
                  onPlay={(it: FlowItem) => {
                    const ts = tracksOf(it.obj as VibeCollection);
                    if (ts[0]) onPlay(ts[0]);
                  }}
                  tracksFor={(it: FlowItem) => tracksOf(it.obj as VibeCollection)}
                  onPlayTrack={onPlay}
                />
              </div>
            )}
            {cardTab && view === "grid" && (
              <CardGrid
                count={coll.length}
                minColumnWidth={176}
                gap={24}
                estimateRowHeight={240}
                itemKey={(i) => coll[i].id}
                renderItem={(i) => {
                  const o = coll[i];
                  return (
                    <MediaCard
                      item={o}
                      round={round}
                      sub={collectionSub(o, tab)}
                      onOpen={() => openOf(o)}
                      onPlay={tab === "artists" ? undefined : () => openOf(o)}
                    />
                  );
                }}
              />
            )}
            {cardTab && view === "list" && (
              <VList
                count={coll.length}
                estimateSize={66}
                itemKey={(i) => coll[i].id}
                renderItem={(i) => {
                  const o = coll[i];
                  return (
                    <CollectionRow
                      item={o}
                      round={round}
                      sub={collectionSub(o, tab)}
                      meta={collectionMeta(o, tab)}
                      onOpen={() => openOf(o)}
                      onPlay={tab === "artists" ? undefined : () => openOf(o)}
                    />
                  );
                }}
              />
            )}
            {tab === "songs" && (
              <div className="grid grid-cols-2 gap-x-10">
                <VList
                  count={half}
                  estimateSize={66}
                  itemKey={(i) => tracks[i].id}
                  renderItem={(i) => (
                    <TrackRow
                      track={tracks[i]}
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
                  count={tracks.length - half}
                  estimateSize={66}
                  itemKey={(i) => tracks[half + i].id}
                  renderItem={(i) => (
                    <TrackRow
                      track={tracks[half + i]}
                      index={half + i + 1}
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
        </div>
      </ScrollProvider>
    </FadeIn>
  );
}
