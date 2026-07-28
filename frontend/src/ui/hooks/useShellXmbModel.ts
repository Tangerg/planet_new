import { useMemo } from "react";

import type { MediaService } from "@contexts/catalog";

import type { LibrarySectionTab, ScreenData, VibeTrack } from "@/model/vibe";
import { buildWorlds } from "@/model/navigation";

type Deps = {
  media: MediaService;
  catalog: ScreenData;
  liked: ReadonlySet<string>;
  current?: VibeTrack;
  queueLength: number;
  goto: (view: string) => void;
  openSearch: () => void;
  openLibrary: (tab: LibrarySectionTab) => void;
  openLikedSongs: () => void;
};

/**
 * Project catalog + capabilities + session state into the XMB launcher tree.
 * Tile text stays as message keys here; the XMB components resolve them, so a
 * language change re-renders the labels without rebuilding the tree.
 */
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
  return useMemo(
    () =>
      buildWorlds(
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
      ),
    [catalog, media, liked, current, queueLength, goto, openSearch, openLibrary, openLikedSongs],
  );
}
