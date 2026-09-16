import { useMemo } from "react";

import type { MediaService } from "@contexts/catalog";

import type { ShellScreenView } from "@/model/shell-screen";
import type { LibrarySectionTab, ScreenData, VibeTrack } from "@/model/vibe";
import { buildWorlds } from "@/model/navigation";

type Deps = {
  media: MediaService;
  catalog: ScreenData;
  liked: ReadonlySet<string>;
  current?: VibeTrack;
  queueLength: number;
  goto: (view: ShellScreenView) => void;
  openSearch: () => void;
  openLibrary: (tab: LibrarySectionTab) => void;
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
