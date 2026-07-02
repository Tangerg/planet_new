import { useMemo } from "react";

import type { MediaService } from "@core";

import type { ScreenData, VibeTrack } from "@/model/vibe";
import { buildWorlds } from "@/model/navigation";

type Deps = {
  media: MediaService;
  catalog: ScreenData;
  liked: ReadonlySet<string>;
  current: VibeTrack;
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
  return useMemo(
    () =>
      buildWorlds(
        {
          catalog,
          supports: (cap) => media.supports(cap),
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
