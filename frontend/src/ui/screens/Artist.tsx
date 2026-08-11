// ============================================================
// Artist — atmospheric circular header + Top tracks · Albums · Similar, each as
// list / grid / flow. Grids/lists are windowed; similar is a windowed rail.
// ============================================================
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  ArtistTarget,
  CollectionViewMode,
  TrackListBindings,
  VibeArtist,
  VibeCollection,
  VibeTrack,
} from "@/model/vibe";
import { artistAlbumListMeta, artistAlbumSubtitle, artistScreenModel } from "@/model/artist-screen";
import { clampIndex } from "@shared/number";
import { localize, localizeJoined } from "@/i18n/text";
import { Art, artPair } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { Button } from "@/components/controls/Button";
import { ToggleGroup } from "@/components/controls/ToggleGroup";
import { ViewToggle } from "@/components/ViewToggle";
import { TextReveal } from "@/components/controls/TextReveal";
import { MediaCard, MEDIA_CARD_ROW_HEIGHT } from "@/components/cards/MediaCard";
import { CollectionRow, COLLECTION_ROW_HEIGHT } from "@/components/cards/CollectionRow";
import { TrackCollectionView } from "@/components/TrackCollectionView";
import { CardGrid } from "@/components/layout/CardGrid";
import { VList } from "@/components/layout/VList";
import { StatPill } from "@/components/layout/StatPill";
import { PageColumn } from "@/components/layout/PageColumn";
import { ScreenScaffold } from "@/components/layout/ScreenScaffold";
import { CoverFlow } from "@/components/CoverFlow";
import { XFade } from "@/components/motion";
import { useCollectionPlayback } from "@/hooks/useCollectionPlayback";
import { useAccent } from "@/hooks/accent";

type ArtistScreenProps = TrackListBindings & {
  artist: ArtistTarget;
  tracks: VibeTrack[];
  albums: VibeCollection[];
  similar: VibeArtist[];
  onOpenAlbum: (album: VibeCollection) => void;
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
  onOpenAlbum,
  onOpenArtist,
}: ArtistScreenProps) {
  const { t } = useTranslation();
  const accent = useAccent();
  const [tab, setTab] = useState("top");
  const [view, setView] = useState<CollectionViewMode>("list");
  const [flowCenter, setFlowCenter] = useState(0);
  // Recentre the flow per tab during render, not in an effect — an effect would
  // paint one frame of the new tab still centered on the old index first.
  const [flowTab, setFlowTab] = useState(tab);
  if (flowTab !== tab) {
    setFlowTab(tab);
    setFlowCenter(0);
  }
  const b = artPair(artist.coverSeed, artist.gradient)[1];
  const model = artistScreenModel({ artist, tracks, albums, similar, tab, current, playing });
  const statLabels = model.statLabels.map((label) => localize(t, label));
  const { playCollection, canPlayCollection } = useCollectionPlayback(onPlay);

  return (
    <ScreenScaffold
      background="#0a0a0d"
      backdrop={{ image: artist.image, seed: artist.coverSeed, grad: artist.gradient }}
    >
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
                onClick={() => model.firstTrack && onPlay(model.firstTrack)}
                disabled={!model.hasPlayableTracks}
                aria-label={t("common.play")}
                className="mr-1 grid h-[54px] w-[54px] flex-none place-items-center rounded-full"
                style={{
                  background: accent,
                  color: "#06060a",
                  boxShadow: `0 10px 30px -6px ${accent}`,
                }}
              >
                {model.playingArtistTrack ? <Icon.pause size={24} /> : <Icon.play size={24} />}
              </Button>
              {/* No follow button: no provider exposes a follow capability, so
                      the only honest options are to omit it or to fake a state.
                      It used to render "Following" for every artist off a local
                      useState(true) — a claim about the user's library that
                      nothing backed. Restore it when a provider port exists. */}
              {statLabels.map((label) => (
                <StatPill key={label}>{label}</StatPill>
              ))}
            </div>
            {artist.bio && (
              <TextReveal
                lines={2}
                cardStyle={{ maxWidth: 520 }}
                style={{
                  marginTop: 18,
                  maxWidth: 640,
                  fontSize: 14,
                  fontWeight: 300,
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,.6)",
                }}
              >
                {artist.bio}
              </TextReveal>
            )}
          </div>
        </PageColumn>
      </div>

      {/* tabs + content */}
      <PageColumn className="pb-10 pt-[26px]">
        <div className="tabs mb-6 items-start">
          <ToggleGroup
            ariaLabel={t("artist.section")}
            className="tabgroup"
            itemClassName="tab"
            value={tab}
            onValueChange={setTab}
            items={model.tabs.map((it) => ({ value: it.value, label: localize(t, it.label) }))}
          />
          {model.showViewToggle && (
            <ViewToggle
              value={view}
              onChange={setView}
              style={{ marginLeft: "auto", transform: "translateY(-8px)" }}
            />
          )}
        </div>

        <XFade key={tab + view}>
          {tab === "top" && (
            <TrackCollectionView
              view={view}
              tracks={tracks}
              onPlay={onPlay}
              current={current}
              playing={playing}
              liked={liked}
              toggleLike={toggleLike}
              onOpenArtist={onOpenArtist}
              flowCenter={flowCenter}
              setFlowCenter={setFlowCenter}
              flowHeight={480}
            />
          )}
          {tab === "albums" && view === "grid" && (
            <CardGrid
              count={albums.length}
              minColumnWidth={176}
              gap={24}
              estimateRowHeight={MEDIA_CARD_ROW_HEIGHT}
              itemKey={(i) => model.albums[i].id}
              renderItem={(i) => {
                const al = model.albums[i];
                return (
                  <MediaCard
                    item={al}
                    sub={artistAlbumSubtitle(al)}
                    onOpen={onOpenAlbum}
                    onPlay={playCollection}
                    playable={canPlayCollection(al)}
                  />
                );
              }}
            />
          )}
          {tab === "albums" && view === "list" && (
            <VList
              count={albums.length}
              estimateSize={COLLECTION_ROW_HEIGHT}
              itemKey={(i) => model.albums[i].id}
              renderItem={(i) => {
                const al = model.albums[i];
                return (
                  <CollectionRow
                    item={al}
                    sub={al.artist || t("common.album")}
                    meta={localizeJoined(t, artistAlbumListMeta(al))}
                    onOpen={onOpenAlbum}
                    onPlay={playCollection}
                    playable={canPlayCollection(al)}
                  />
                );
              }}
            />
          )}
          {tab === "albums" && view === "flow" && (
            <div className="-mx-12 h-[480px]">
              <CoverFlow
                items={model.albumFlowItems}
                center={clampIndex(flowCenter, model.albums.length)}
                setCenter={setFlowCenter}
                onOpen={onOpenAlbum}
                onPlay={playCollection}
                canPlay={canPlayCollection}
                tracksFor={(al) => al.tracks}
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
              estimateRowHeight={MEDIA_CARD_ROW_HEIGHT}
              itemKey={(i) => model.similar[i].id}
              renderItem={(i) => {
                const ar = model.similar[i];
                return (
                  <MediaCard
                    item={ar}
                    round
                    sub={t("common.artist")}
                    liftScale={1.12}
                    liftY={-6}
                    onOpen={onOpenArtist}
                  />
                );
              }}
            />
          )}
        </XFade>
      </PageColumn>
    </ScreenScaffold>
  );
}
