import type { OpenTarget, ScreenData, VibeCollection, VibeTrack } from "./vibe";

export const TRACK_DRAG_MIME = "text/sonance-track";

export type QueueLookupContext = {
  catalogTracks: readonly VibeTrack[];
  playContext: readonly VibeTrack[];
  playbackTracks: readonly VibeTrack[];
  queueTracks: readonly VibeTrack[];
};

export function playbackContextForTrack(
  track: VibeTrack,
  context: readonly VibeTrack[] | null | undefined,
): VibeTrack[] {
  return context?.some((item) => item.id === track.id) ? [...context] : [track];
}

export function firstPlayableCollectionTrack(
  collection: Pick<VibeCollection, "tracks">,
): VibeTrack | undefined {
  return collection.tracks.find((track) => !!track.playUrl && !track.requiresSubscription);
}

export function queueLookupCandidates({
  catalogTracks,
  playContext,
  playbackTracks,
  queueTracks,
}: QueueLookupContext): VibeTrack[] {
  return [...playContext, ...playbackTracks, ...queueTracks, ...catalogTracks];
}

export function findQueueTrack(
  trackId: string,
  context: QueueLookupContext,
): VibeTrack | undefined {
  return queueLookupCandidates(context).find((track) => track.id === trackId);
}

export function writeTrackDragData(dataTransfer: Pick<DataTransfer, "setData">, trackId: string) {
  dataTransfer.setData(TRACK_DRAG_MIME, trackId);
}

export function canAcceptTrackDrag(types: { includes(type: string): boolean }): boolean {
  return types.includes(TRACK_DRAG_MIME);
}

export function readTrackDragData(dataTransfer: Pick<DataTransfer, "getData">): string | null {
  const trackId = dataTransfer.getData(TRACK_DRAG_MIME).trim();
  return trackId || null;
}

export function syntheticLikedSongsCollection(
  catalog: Pick<ScreenData, "allTracks">,
  liked: ReadonlySet<string>,
): VibeCollection {
  return {
    id: "liked",
    name: "Liked Songs",
    kind: "Playlist",
    owner: "You",
    coverSeed: 0,
    gradient: ["#2a0420", "#ff4fa3"],
    fetchDetail: false,
    description: "Everything you've hearted, in one place.",
    tracks: catalog.allTracks.filter((track) => liked.has(track.id)),
  };
}

export function likedSongsOpenTarget({
  catalog,
  liked,
  loggedIn,
  userPlaylists,
}: {
  catalog: Pick<ScreenData, "allTracks">;
  liked: ReadonlySet<string>;
  loggedIn: boolean;
  userPlaylists: readonly VibeCollection[];
}): OpenTarget {
  const real = loggedIn ? userPlaylists[0] : undefined;
  return real ? { ...real, kind: "Playlist" } : syntheticLikedSongsCollection(catalog, liked);
}
