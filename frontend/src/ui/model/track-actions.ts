import {
  sameVibeTrack,
  vibeTrackKey,
  type OpenTarget,
  type ScreenData,
  type VibeCollection,
  type VibeTrack,
} from "./vibe";
import { TrackKey, type TrackKeyValue } from "@contexts/contracts";
import { isVibeTrackLiked } from "./likes";

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
  return context?.some((item) => sameVibeTrack(item, track)) ? [...context] : [track];
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
  trackKey: string,
  context: QueueLookupContext,
): VibeTrack | undefined {
  return queueLookupCandidates(context).find((track) => vibeTrackKey(track) === trackKey);
}

export function writeTrackDragData(
  dataTransfer: Pick<DataTransfer, "setData">,
  track: Pick<VibeTrack, "providerId" | "id">,
) {
  const key = vibeTrackKey(track);
  if (key) dataTransfer.setData(TRACK_DRAG_MIME, key);
}

export function canAcceptTrackDrag(types: { includes(type: string): boolean }): boolean {
  return types.includes(TRACK_DRAG_MIME);
}

export function readTrackDragData(
  dataTransfer: Pick<DataTransfer, "getData">,
): TrackKeyValue | null {
  const key = dataTransfer.getData(TRACK_DRAG_MIME).trim();
  if (!key) return null;
  try {
    TrackKey.parse(key);
    return key as TrackKeyValue;
  } catch {
    return null;
  }
}

export function syntheticLikedSongsCollection(
  catalog: Pick<ScreenData, "allTracks">,
  liked: ReadonlySet<string>,
): VibeCollection {
  return {
    id: "liked",
    name: "Liked Songs",
    kind: "playlist",
    owner: "You",
    coverSeed: 0,
    gradient: ["#2a0420", "#ff4fa3"],
    fetchDetail: false,
    description: "Everything you've hearted, in one place.",
    tracks: catalog.allTracks.filter((track) => isVibeTrackLiked(liked, track)),
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
  return real ? { ...real, kind: "playlist" } : syntheticLikedSongsCollection(catalog, liked);
}
