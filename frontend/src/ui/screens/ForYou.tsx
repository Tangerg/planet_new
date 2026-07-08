// ============================================================
// ForYou — rich editorial home: hero · quick tiles · card rails.
// ============================================================
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ArtistRef, ScreenData, VibeCollection, VibeTrack } from "@/model/vibe";
import { Art } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { LiftCard } from "@/components/lift";
import { MediaCard } from "@/components/cards/MediaCard";
import { Rail } from "@/components/layout/Rail";
import { HeroBanner } from "@/components/layout/HeroBanner";
import { ScreenScaffold } from "@/components/layout/ScreenScaffold";
import { PageColumn } from "@/components/layout/PageColumn";
import { Empty } from "@/components/layout/Empty";
import { Button } from "@/components/controls/Button";
import { useMorphOpen } from "@/hooks/useMorphOpen";
import { useScreenActions } from "@/hooks/screenActions";
import { useCollectionPlayback } from "@/hooks/useCollectionPlayback";
import { forYouCollectionRoute, forYouScreenModel } from "@/model/for-you";
import { activateOnKey } from "@/lib/keys";

type ForYouScreenProps = {
  data: ScreenData;
  /** The day's recommendations ("每日推荐"); when present, headlines the hero. */
  daily: VibeTrack[];
  onPlay: (track: VibeTrack) => void;
  openPlaylist: (p: VibeCollection) => void;
  openAlbum: (a: VibeCollection) => void;
  openArtist: (artist: ArtistRef) => void;
  openLibrary: (tab: string) => void;
  accent: string;
};

export const ForYouScreen = React.memo(function ForYouScreen({
  data,
  daily,
  onPlay,
  openPlaylist,
  openAlbum,
  openArtist,
  openLibrary,
  accent,
}: ForYouScreenProps) {
  const { t } = useTranslation();
  const open = useMorphOpen();
  const { collMenu } = useScreenActions();
  const [chip, setChip] = useState("All");
  const model = useMemo(() => forYouScreenModel(data, daily), [daily, data]);
  const { albums, artists, featured, filters, greeting, playlists, tiles } = model;
  const filterLabels: Record<string, string> = {
    All: t("common.all"),
    Music: t("common.music"),
    Mixes: t("common.mixes"),
    Charts: t("common.charts"),
  };
  const greetingLabels: Record<string, string> = {
    "Late night": t("forYou.lateNight"),
    "Good morning": t("forYou.morning"),
    "Good afternoon": t("forYou.afternoon"),
    "Good evening": t("forYou.evening"),
  };
  const { playCollection, canPlayCollection } = useCollectionPlayback(onPlay);
  // Stable so the memoized rail/tile cards don't re-render when the chip toggles.
  const openTile = useCallback(
    (t: VibeCollection) => (forYouCollectionRoute(t) === "album" ? openAlbum(t) : openPlaylist(t)),
    [openAlbum, openPlaylist],
  );

  if (!featured) {
    return (
      <ScreenScaffold background="#08080b">
        <PageColumn className="flex h-full flex-col pb-[50px] pt-[60px]">
          <div className="mb-[30px] flex items-end justify-between">
            <div>
              <div className="mlabel mb-2" style={{ color: accent }}>
                {greetingLabels[greeting] ?? greeting}
              </div>
              <div className="text-[36px] font-extralight tracking-[0.01em]">
                {t("forYou.title")}
              </div>
            </div>
            <div className="flex gap-2.5">
              {filters.map((c) => (
                <Button
                  key={c}
                  className={"chip" + (chip === c ? " on" : "")}
                  onClick={() => setChip(c)}
                >
                  {filterLabels[c] ?? c}
                </Button>
              ))}
            </div>
          </div>
          <Empty className="flex min-h-[360px] items-center justify-center rounded-[22px] bg-white/[0.03] p-[50px] text-center text-[22px]">
            {t("forYou.empty")}
          </Empty>
        </PageColumn>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      background="#08080b"
      backdrop={{ image: featured.image, seed: featured.coverSeed, grad: featured.gradient }}
    >
      <PageColumn className="pb-[50px] pt-[60px]">
        {/* greeting + chips */}
        <div className="mb-[30px] flex items-end justify-between">
          <div>
            <div className="mlabel mb-2" style={{ color: accent }}>
              {greetingLabels[greeting] ?? greeting}
            </div>
            <div className="text-[36px] font-extralight tracking-[0.01em]">{t("forYou.title")}</div>
          </div>
          <div className="flex gap-2.5">
            {filters.map((c) => (
              <Button
                key={c}
                className={"chip" + (chip === c ? " on" : "")}
                onClick={() => setChip(c)}
              >
                {filterLabels[c] ?? c}
              </Button>
            ))}
          </div>
        </div>

        <HeroBanner
          playlist={featured}
          accent={accent}
          onOpen={() => openPlaylist(featured)}
          onPlay={canPlayCollection(featured) ? () => playCollection(featured) : undefined}
        />

        {/* quick tiles — grid-cols-4 is repeat(4, minmax(0,1fr)): a long tile name
            must not blow its track past its share and push the grid past the viewport. */}
        <div className="mb-[44px] grid grid-cols-4 gap-2.5">
          {tiles.map((tile) => {
            const activate = (e: React.MouseEvent | React.KeyboardEvent) =>
              open(e, {
                seed: tile.coverSeed,
                grad: tile.gradient,
                image: tile.image,
                artSelector: ".tart",
                run: () => openTile(tile),
              });
            const activateFromTarget = (e: React.MouseEvent | React.KeyboardEvent) => {
              e.stopPropagation();
              activate(e);
            };
            return (
              <LiftCard
                key={tile.id}
                className="tile"
                scale={1.08}
                liftY={-4}
                onClick={activate}
                onContextMenu={(e) => collMenu(e, tile)}
              >
                <div
                  // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- rich tile body, not valid native button content
                  role="button"
                  tabIndex={0}
                  aria-label={tile.name}
                  onClick={activateFromTarget}
                  onKeyDown={activateOnKey(activateFromTarget)}
                  className="flex min-w-0 flex-1 items-center gap-[14px]"
                >
                  <Art
                    seed={tile.coverSeed}
                    grad={tile.gradient}
                    image={tile.image}
                    images={tile.images}
                    px={72}
                    className="tart"
                  />
                  <span className="tname">{tile.name}</span>
                </div>
                {canPlayCollection(tile) && (
                  <Button
                    className="tfab"
                    aria-label={t("a11y.playItem", { name: tile.name })}
                    onClick={(e) => {
                      e.stopPropagation();
                      playCollection(tile);
                    }}
                  >
                    <Icon.play size={15} />
                  </Button>
                )}
              </LiftCard>
            );
          })}
        </div>

        <Rail
          title={t("forYou.madeForYou")}
          onAll={() => openLibrary("playlists")}
          count={playlists.length}
          itemKey={(i) => playlists[i].id}
          renderItem={(i) => {
            const p = playlists[i];
            return (
              <MediaCard
                item={p}
                sub={p.kind}
                liftScale={1.12}
                liftY={-6}
                onOpen={openPlaylist}
                onPlay={playCollection}
                playable={canPlayCollection(p)}
              />
            );
          }}
        />

        <Rail
          title={t("forYou.recentlyPlayed")}
          onAll={() => openLibrary("albums")}
          count={albums.length}
          itemKey={(i) => albums[i].id}
          renderItem={(i) => {
            const al = albums[i];
            return (
              <MediaCard
                item={al}
                sub={al.artist}
                liftScale={1.12}
                liftY={-6}
                onOpen={openAlbum}
                onPlay={playCollection}
                playable={canPlayCollection(al)}
              />
            );
          }}
        />

        <Rail
          title={t("forYou.yourArtists")}
          onAll={() => openLibrary("artists")}
          count={artists.length}
          itemKey={(i) => artists[i].id}
          renderItem={(i) => {
            const ar = artists[i];
            return (
              <MediaCard
                item={ar}
                round
                sub={t("common.artist")}
                liftScale={1.12}
                liftY={-6}
                onOpen={openArtist}
              />
            );
          }}
        />
      </PageColumn>
    </ScreenScaffold>
  );
});
