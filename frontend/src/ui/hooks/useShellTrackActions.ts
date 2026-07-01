import { useCallback, type RefObject } from "react";

import type {
  ArtistTarget,
  OpenTarget,
  ScreenData,
  VibeCollection,
  VibeTrack,
} from "@/model/adapt";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useQueueActions } from "@/hooks/useQueueActions";

type Deps = {
  play: (tracks: VibeTrack[], track: VibeTrack) => void;
  addToQueue: (track: VibeTrack) => void;
  catalog: ScreenData;
  playbackTracks: readonly VibeTrack[];
  queue: readonly VibeTrack[];
  playContext: RefObject<VibeTrack[]>;
  loggedIn: boolean;
  userPlaylists: VibeCollection[];
  liked: Set<string>;
  openDetail: (item: OpenTarget) => void;
  openArtist: (artist: ArtistTarget) => void;
  toggleLike: (id: string) => void;
};

export function useShellTrackActions({
  play,
  addToQueue,
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
  const onPlay = useCallback(
    (track: VibeTrack | undefined) => {
      if (!track) return;
      const ctx = playContext.current;
      const list = ctx?.length && ctx.some((item) => item.id === track.id) ? ctx : [track];
      play(list, track);
    },
    [play, playContext],
  );

  const likedDetail = useCallback(() => {
    const real = loggedIn ? userPlaylists[0] : undefined;
    if (real) {
      openDetail({ ...real, kind: "Playlist" });
      return;
    }
    openDetail({
      id: "liked",
      name: "Liked Songs",
      kind: "Playlist",
      owner: "You",
      coverSeed: 0,
      gradient: ["#2a0420", "#ff4fa3"],
      _real: false,
      description: "Everything you've hearted, in one place.",
      tracks: catalog.allTracks.filter((track) => liked.has(track.id)),
    });
  }, [openDetail, loggedIn, userPlaylists, catalog, liked]);

  const { enqueueById } = useQueueActions({
    addToQueue,
    catalogTracks: catalog.allTracks,
    playbackTracks,
    queueTracks: queue,
    playContext,
  });

  const { menu, setMenu, actions } = useContextMenu({
    onPlay,
    enqueue: enqueueById,
    openDetail,
    openArtist,
    toggleLike,
    liked,
  });

  return { onPlay, likedDetail, menu, setMenu, actions };
}
