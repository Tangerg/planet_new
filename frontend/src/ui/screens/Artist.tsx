// ============================================================
// Artist — atmospheric circular header + Top tracks · Albums · Similar, each as
// list / grid / flow. Grids/lists are windowed; similar is a windowed rail.
// ============================================================
import React, { useRef, useState, useEffect } from "react";
import type { ArtistTarget, VibeArtist, VibeCollection, VibeTrack } from "@/model/adapt";
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
  onOpenArtist: (artist: { id: string; name: string }) => void;
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
    <FadeIn style={{ height: "100%", position: "relative", background: "#0a0a0d" }}>
      <HeroBackdrop image={artist.image} seed={artist.coverSeed} grad={artist.gradient} />
      <div
        ref={scrollRef}
        className="scroll"
        style={{ position: "relative", zIndex: 2, height: "100%" }}
      >
        <ScrollProvider value={scrollRef}>
          {/* header — atmospheric circle: blurred backdrop + seeded colour wash +
              a large circular portrait with a soft halo carry identity. */}
          <div style={{ position: "relative", padding: "88px 48px 32px" }}>
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                pointerEvents: "none",
                background: `radial-gradient(86% 140% at 14% -16%, ${b}4d, transparent 62%)`,
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                gap: 40,
              }}
            >
              {/* circular portrait + soft colour halo */}
              <div style={{ position: "relative", flex: "0 0 auto" }}>
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: -28,
                    borderRadius: "50%",
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 60,
                    fontWeight: 200,
                    letterSpacing: ".01em",
                    lineHeight: 1.02,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    overflowWrap: "anywhere",
                  }}
                >
                  {artist.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    marginTop: 24,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <Button
                    onClick={() => onPlay(tracks[0])}
                    aria-label="Play"
                    style={{
                      flex: "0 0 auto",
                      width: 54,
                      height: 54,
                      borderRadius: "50%",
                      border: 0,
                      cursor: "pointer",
                      background: accent,
                      color: "#06060a",
                      display: "grid",
                      placeItems: "center",
                      boxShadow: `0 10px 30px -6px ${accent}`,
                      marginRight: 4,
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
                    className="tag"
                    style={{
                      cursor: "pointer",
                      borderRadius: 999,
                      border: 0,
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
            </div>
          </div>

          {/* tabs + content */}
          <div
            style={{
              padding: "26px 48px 40px",
              maxWidth: 1320,
              margin: "0 auto",
              boxSizing: "border-box",
            }}
          >
            <div
              className="tabs"
              style={{ marginBottom: 24, display: "flex", alignItems: "flex-start" }}
            >
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
                <div style={{ height: 480, margin: "0 -48px" }}>
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
                <div style={{ height: 480, margin: "0 -48px" }}>
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
          </div>
        </ScrollProvider>
      </div>
    </FadeIn>
  );
}
