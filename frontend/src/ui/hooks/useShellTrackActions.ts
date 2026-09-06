import { useCallback, type RefObject } from "react";
import { useTranslation } from "react-i18next";

import type { ArtistTarget, OpenTarget, ScreenData, VibeCollection, VibeTrack } from "@/model/vibe";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useQueueActions } from "@/hooks/useQueueActions";
import { likedSongsOpenTarget, playbackContextForTrack } from "@/model/track-actions";

type Deps = {
  play: (tracks: VibeTrack[], track: VibeTrack) => void;
  addToQueue: (track: VibeTrack) => void;
  addNextToQueue: (track: VibeTrack) => void;
  catalog: ScreenData;
  playbackTracks: readonly VibeTrack[];
  queue: readonly VibeTrack[];
  playContext: RefObject<VibeTrack[]>;
  loggedIn: boolean;
  userPlaylists: VibeCollection[];
  liked: Set<string>;
  openDetail: (item: OpenTarget) => void;
  openArtist: (artist: ArtistTarget) => void;
  toggleLike: (track: VibeTrack) => void;
};

export function useShellTrackActions({
  play,
  addToQueue,
  addNextToQueue,
  catalog,
  playbackTracks,
  queue,
  playContext,
  loggedIn,
  userPlaylists,
  liked,
  openDetail,
  openArtist,
  toggleLike,
}: Deps) {
  const { t } = useTranslation();
  const onPlay = useCallback(
    (track: VibeTrack | undefined) => {
      if (!track) return;
      const list = playbackContextForTrack(track, playContext.current);
      play(list, track);
    },
    [play, playContext],
  );

  const likedDetail = useCallback(() => {
    openDetail(
      likedSongsOpenTarget({
        catalog,
        liked,
        loggedIn,
        text: {
          name: t("library.likedSongs"),
          owner: t("library.likedSongsOwner"),
          description: t("library.likedSongsDescription"),
        },
        userPlaylists,
      }),
    );
  }, [openDetail, loggedIn, t, userPlaylists, catalog, liked]);

  const { enqueueByKey } = useQueueActions({
    addToQueue,
    addNextToQueue,
    catalogTracks: catalog.allTracks,
    playbackTracks,
    queueTracks: queue,
    playContext,
  });

  const { menu, setMenu, actions } = useContextMenu({
    onPlay,
    enqueue: enqueueByKey,
    openDetail,
    openArtist,
    toggleLike,
    liked,
  });

  return { onPlay, likedDetail, menu, setMenu, actions };
}
