// ============================================================
// Artist — atmospheric circular header + Top tracks · Albums · Similar, each as
// list / grid / flow. Grids/lists are windowed; similar is a windowed rail.
// ============================================================
import React, { useRef, useState, useEffect } from "react";
import type { ArtistRef, ArtistTarget, VibeArtist, VibeCollection, VibeTrack } from "@/model/adapt";
import { collectionFlowItems, trackFlowItems, type FlowItem } from "@/model/derive";
import { Icon, Art, artPair, HeroBackdrop } from "@/components/primitives";
import { Button } from "@/components/controls/Button";
import { ToggleGroup } from "@/components/controls/ToggleGroup";
import { ViewToggle } from "@/components/ViewToggle";
import { MediaCard } from "@/components/cards/MediaCard";
import { CollectionRow } from "@/components/cards/CollectionRow";
import { TrackRow } from "@/components/cards/TrackRow";
import { TrackCard } from "@/components/cards/TrackCard";
import { CardGrid } from "@/components/layout/CardGrid";
import { VList } from "@/components/layout/VList";
import { StatPill } from "@/components/layout/StatPill";
import { PageColumn } from "@/components/layout/PageColumn";
import { ScrollProvider } from "@/components/layout/ScrollContext";
import { CoverFlow } from "@/components/CoverFlow";
import { FadeIn, XFade } from "@/components/motion";

type ArtistScreenProps = {
  artist: ArtistTarget;
  tracks: VibeTrack[];
  albums: VibeCollection[];
  similar: VibeArtist[];
  onPlay: (track: VibeTrack) => void;
  current?: VibeTrack;
  playing: boolean;
  liked: Set<string>;
  toggleLike: (id: string) => void;
  accent: string;
  onOpenAlbum: (album: VibeCollection) => void;
  onOpenArtist: (artist: ArtistRef) => void;
  mono: boolean;
};

export function ArtistScreen({
  artist,
  tracks,
  albums,
  similar,
  onPlay,
  current,
  playing,
  liked,
  toggleLike,
  accent,
  onOpenAlbum,
  onOpenArtist,
  mono,
}: ArtistScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState("top");
  const [view, setView] = useState("list");
  const [flowCenter, setFlowCenter] = useState(0);
  useEffect(() => {
    setFlowCenter(0);
  }, [tab]);
  const b = artPair(artist.coverSeed, artist.gradient)[1];
  const [followed, setFollowed] = useState(true);

  return (
    <FadeIn className="relative h-full bg-[#0a0a0d]">
      <HeroBackdrop image={artist.image} seed={artist.coverSeed} grad={artist.gradient} />
      <div ref={scrollRef} className="scroll relative z-[2] h-full">
        <ScrollProvider value={scrollRef}>
          {/* header — atmospheric circle: blurred backdrop + seeded colour wash +
              a large circular portrait with a soft halo carry identity. The wash
              stays full-bleed; the portrait/name ride the same centered column as
              the track list below, so they line up on large screens. */}
          <div className="relative pb-8 pt-[88px]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                background: `radial-gradient(86% 140% at 14% -16%, ${b}4d, transparent 62%)`,
              }}
            />
            <PageColumn className="relative z-[1] flex items-center gap-10">
              {/* circular portrait + soft colour halo */}
              <div className="relative flex-none">
                <div
                  aria-hidden
                  className="absolute -inset-7 rounded-full"
                  style={{
                    background: `radial-gradient(closest-side, ${b}66, transparent 72%)`,
                    filter: "blur(28px)",
                  }}
                />
                <Art
                  seed={artist.coverSeed}
                  grad={artist.gradient}
                  image={artist.image}
                  images={artist.images}
                  mono={mono}
                  // Morph anchor: opening from a round artist card flies the tile
                  // straight into this circle — a clean circle→circle morph.
                  data-hero="1"
                  style={{
                    position: "relative",
                    width: 216,
                    height: 216,
                    borderRadius: "50%",
                    boxShadow:
                      "0 26px 64px -18px rgba(0,0,0,.75), inset 0 0 0 1px rgba(255,255,255,.1)",
                  }}
                />
              </div>
              {/* name + stats */}
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-[60px] font-extralight leading-[1.02] tracking-[0.01em] [overflow-wrap:anywhere]">
                  {artist.name}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-[14px]">
                  <Button
                    onClick={() => onPlay(tracks[0])}
                    aria-label="Play"
                    className="mr-1 grid h-[54px] w-[54px] flex-none place-items-center rounded-full"
                    style={{
                      background: accent,
                      color: "#06060a",
                      boxShadow: `0 10px 30px -6px ${accent}`,
                    }}
                  >
                    {playing && tracks.some((t) => t.id === current?.id) ? (
                      <Icon.pause size={24} />
                    ) : (
                      <Icon.play size={24} />
                    )}
                  </Button>
                  <Button
                    onClick={() => setFollowed((f) => !f)}
                    className="tag rounded-full"
                    style={{
                      background: followed
                        ? `linear-gradient(90deg, ${accent}, ${b})`
                        : "rgba(255,255,255,.14)",
                      color: followed ? "#06060a" : "#fff",
                    }}
                  >
                    {followed ? "Following" : "Follow"}
                  </Button>
                  <StatPill>
                    {tracks.length} {tracks.length === 1 ? "Track" : "Tracks"}
                  </StatPill>
                  {/* hide stat pills with no real data instead of showing "0 ALBUMS" */}
                  {albums.length > 0 && (
                    <StatPill>
                      {albums.length} {albums.length === 1 ? "Album" : "Albums"}
                    </StatPill>
                  )}
                  {artist.listeners ? <StatPill>{artist.listeners} Listeners</StatPill> : null}
                  {(artist.genres || []).map((g) => (
                    <StatPill key={g}>{g}</StatPill>
                  ))}
                </div>
              </div>
            </PageColumn>
          </div>

          {/* tabs + content */}
          <PageColumn className="pb-10 pt-[26px]">
            <div className="tabs mb-6 items-start">
              <ToggleGroup
                ariaLabel="Artist section"
                className="tabgroup"
                itemClassName="tab"
                value={tab}
                onValueChange={setTab}
                items={[
                  { value: "top", label: "Top 50" },
                  { value: "albums", label: "All Albums" },
                  { value: "similar", label: "Similar Artist" },
                ]}
              />
              {tab !== "similar" && (
                <ViewToggle
                  value={view}
                  onChange={setView}
                  style={{ marginLeft: "auto", transform: "translateY(-8px)" }}
                />
              )}
            </div>

            <XFade key={tab + view}>
              {tab === "top" && view === "list" && (
                <VList
                  count={tracks.length}
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
                      onOpenArtist={onOpenArtist}
                    />
                  )}
                />
              )}
              {tab === "top" && view === "grid" && (
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
              )}
              {tab === "top" && view === "flow" && (
                <div className="-mx-12 h-[480px]">
                  <CoverFlow
                    items={trackFlowItems(tracks)}
                    center={Math.min(flowCenter, tracks.length - 1)}
                    setCenter={setFlowCenter}
                    accent={accent}
                    onOpen={(it: FlowItem) => onPlay(it.obj as VibeTrack)}
                    onPlay={(it: FlowItem) => onPlay(it.obj as VibeTrack)}
                  />
                </div>
              )}
              {tab === "albums" && view === "grid" && (
                <CardGrid
                  count={albums.length}
                  minColumnWidth={176}
                  gap={24}
                  estimateRowHeight={240}
                  itemKey={(i) => albums[i].id}
                  renderItem={(i) => {
                    const al = albums[i];
                    return (
                      <MediaCard
                        item={al}
                        sub={String(al.year ?? "")}
                        onOpen={() => onOpenAlbum(al)}
                        onPlay={() => onOpenAlbum(al)}
                      />
                    );
                  }}
                />
              )}
              {tab === "albums" && view === "list" && (
                <VList
                  count={albums.length}
                  estimateSize={66}
                  itemKey={(i) => albums[i].id}
                  renderItem={(i) => {
                    const al = albums[i];
                    return (
                      <CollectionRow
                        item={al}
                        sub={al.artist || "Album"}
                        meta={`${al.year} · ${al.tracks ? al.tracks.length : 0} tracks`}
                        onOpen={() => onOpenAlbum(al)}
                        onPlay={() => onOpenAlbum(al)}
                      />
                    );
                  }}
                />
              )}
              {tab === "albums" && view === "flow" && (
                <div className="-mx-12 h-[480px]">
                  <CoverFlow
                    items={collectionFlowItems(albums, (al) => String(al.year ?? ""))}
                    center={Math.min(flowCenter, albums.length - 1)}
                    setCenter={setFlowCenter}
                    accent={accent}
                    onOpen={(it: FlowItem) => onOpenAlbum(it.obj as VibeCollection)}
                    onPlay={(it: FlowItem) => onOpenAlbum(it.obj as VibeCollection)}
                    tracksFor={(it: FlowItem) => (it.obj as VibeCollection).tracks}
                    onPlayTrack={onPlay}
                  />
                </div>
              )}
              {tab === "similar" && (
                // Wrapping grid (the original flex-wrap rail), windowed.
                <CardGrid
                  count={similar.length}
                  minColumnWidth={176}
                  gap={18}
                  estimateRowHeight={240}
                  itemKey={(i) => similar[i].id}
                  renderItem={(i) => {
                    const ar = similar[i];
                    return (
                      <MediaCard
                        item={ar}
                        round
                        sub="Artist"
                        liftScale={1.12}
                        liftY={-6}
                        onOpen={() => onOpenArtist(ar)}
                      />
                    );
                  }}
                />
              )}
            </XFade>
          </PageColumn>
        </ScrollProvider>
      </div>
    </FadeIn>
  );
}
