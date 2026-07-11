import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { MediaService } from "@contexts/catalog";

import type { ScreenData, VibeTrack } from "@/model/vibe";
import { buildWorlds, type XmbCat } from "@/model/navigation";

type Deps = {
  media: MediaService;
  catalog: ScreenData;
  liked: ReadonlySet<string>;
  current?: VibeTrack;
  queueLength: number;
  goto: (view: string) => void;
  openSearch: () => void;
  openLibrary: (tab: string) => void;
  openLikedSongs: () => void;
};

export function useShellXmbModel({
  media,
  catalog,
  liked,
  current,
  queueLength,
  goto,
  openSearch,
  openLibrary,
  openLikedSongs,
}: Deps) {
  const { t } = useTranslation();
  return useMemo(() => {
    const worlds = buildWorlds(
      {
        catalog,
        availability: media.availability,
        liked,
        current,
        queueLength,
      },
      {
        goto,
        openSearch,
        openLibrary,
        openLikedSongs,
      },
    );
    return localizeWorlds(worlds, {
      albumCount: catalog.albums.length,
      artistCount: catalog.artists.length,
      current,
      likedCount: liked.size,
      playlistCount: catalog.playlists.length,
      queueLength,
      t,
    });
  }, [
    catalog,
    media,
    liked,
    current,
    queueLength,
    goto,
    openSearch,
    openLibrary,
    openLikedSongs,
    t,
  ]);
}

function localizeWorlds(
  worlds: XmbCat[],
  {
    albumCount,
    artistCount,
    current,
    likedCount,
    playlistCount,
    queueLength,
    t,
  }: {
    albumCount: number;
    artistCount: number;
    current?: VibeTrack;
    likedCount: number;
    playlistCount: number;
    queueLength: number;
    t: (key: string, values?: Record<string, unknown>) => string;
  },
): XmbCat[] {
  const categoryLabels: Record<string, string> = {
    discover: t("common.discover"),
    library: t("common.library"),
    np: t("common.nowPlaying"),
    settings: t("common.settings"),
    you: t("common.profile"),
  };
  return worlds.map((world) => ({
    ...world,
    label: categoryLabels[world.id] ?? world.label,
    items: world.items.map((item) => {
      switch (item.key) {
        case "about":
          return { ...item, label: t("nav.about"), sub: t("nav.aboutSub") };
        case "albums":
          return {
            ...item,
            label: t("common.albums"),
            sub: t("counts.albums", { count: albumCount }),
          };
        case "artists":
          return {
            ...item,
            label: t("common.artists"),
            sub: t("counts.artistsFollowing", { count: artistCount }),
          };
        case "charts":
          return { ...item, label: t("common.charts"), sub: t("nav.rankedByPlays") };
        case "foryou":
          return { ...item, label: t("nav.forYou"), sub: t("nav.yourDailyLanding") };
        case "history":
          return { ...item, label: t("common.history"), sub: t("nav.historySub") };
        case "liked":
          return {
            ...item,
            label: t("nav.likedSongs"),
            sub: t("counts.tracks", { count: likedCount }),
          };
        case "player":
          return { ...item, label: current?.title || t("common.nowPlaying"), sub: current?.artist };
        case "playlists":
          return {
            ...item,
            label: t("common.playlists"),
            sub: t("counts.playlists", { count: playlistCount }),
          };
        case "prefs":
          return { ...item, label: t("nav.preferences"), sub: t("nav.audioThemeInterface") };
        case "profile":
          return { ...item, label: t("common.profile"), sub: t("nav.profileSub") };
        case "queue":
          return {
            ...item,
            label: t("common.upNext"),
            sub: t("counts.queued", { count: queueLength }),
          };
        case "search":
          return { ...item, label: t("common.search"), sub: t("nav.discoverSearchSub") };
        case "stats":
          return { ...item, label: t("nav.listening"), sub: t("nav.listeningSub") };
        default:
          return item;
      }
    }),
  }));
}
