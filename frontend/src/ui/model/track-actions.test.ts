import { describe, expect, it } from "vitest";

import type { ScreenData, VibeCollection, VibeTrack } from "./vibe";
import {
  canAcceptTrackDrag,
  findQueueTrack,
  firstPlayableCollectionTrack,
  likedSongsOpenTarget,
  playbackContextForTrack,
  queueLookupCandidates,
  readTrackDragData,
  syntheticLikedSongsCollection,
  TRACK_DRAG_MIME,
  writeTrackDragData,
} from "./track-actions";

const track = (id: string): VibeTrack => ({
  id,
  title: id,
  name: id,
  artist: "Artist",
  coverSeed: 1,
  durSec: 10,
  duration: "0:10",
  playUrl: `https://media.test/${id}.mp3`,
});

const playlist = (id: string): VibeCollection => ({
  id,
  name: id,
  kind: "Playlist",
  coverSeed: 1,
  tracks: [],
});

const catalog = (tracks: VibeTrack[]): Pick<ScreenData, "allTracks"> => ({ allTracks: tracks });

describe("track action model", () => {
  it("plays inside the current context only when the selected track belongs to it", () => {
    const selected = track("selected");
    const context = [track("a"), selected, track("b")];

    expect(playbackContextForTrack(selected, context).map((item) => item.id)).toEqual([
      "a",
      "selected",
      "b",
    ]);
    expect(playbackContextForTrack(track("outside"), context).map((item) => item.id)).toEqual([
      "outside",
    ]);
  });

  it("selects a real playable track for collection play buttons", () => {
    const playable = track("playable");
    const vipOnly = { ...track("vip"), requiresSubscription: true };
    const unresolved = { ...track("unresolved"), playUrl: undefined };

    expect(firstPlayableCollectionTrack({ tracks: [vipOnly, unresolved, playable] })?.id).toBe(
      "playable",
    );
    expect(firstPlayableCollectionTrack({ tracks: [vipOnly] })).toBeUndefined();
    expect(firstPlayableCollectionTrack({ tracks: [unresolved] })).toBeUndefined();
    expect(firstPlayableCollectionTrack({ tracks: [] })).toBeUndefined();
  });

  it("searches queue candidates by interaction priority", () => {
    const context = {
      playContext: [track("ctx")],
      playbackTracks: [track("playback")],
      queueTracks: [track("queue")],
      catalogTracks: [track("catalog")],
    };

    expect(queueLookupCandidates(context).map((item) => item.id)).toEqual([
      "ctx",
      "playback",
      "queue",
      "catalog",
    ]);
    expect(findQueueTrack("queue", context)?.id).toBe("queue");
    expect(findQueueTrack("missing", context)).toBeUndefined();
  });

  it("keeps the drag payload contract for queue drops in one place", () => {
    const store = new Map<string, string>();
    const dataTransfer = {
      setData: (type: string, value: string) => store.set(type, value),
      getData: (type: string) => store.get(type) ?? "",
    };

    writeTrackDragData(dataTransfer, "track-1");

    expect(store.get(TRACK_DRAG_MIME)).toBe("track-1");
    expect(canAcceptTrackDrag([TRACK_DRAG_MIME])).toBe(true);
    expect(canAcceptTrackDrag(["text/plain"])).toBe(false);
    expect(readTrackDragData(dataTransfer)).toBe("track-1");

    store.set(TRACK_DRAG_MIME, "   ");
    expect(readTrackDragData(dataTransfer)).toBeNull();
  });

  it("builds the anonymous liked songs collection from catalog tracks", () => {
    const liked = syntheticLikedSongsCollection(catalog([track("a"), track("b")]), new Set(["b"]));

    expect(liked).toMatchObject({
      id: "liked",
      name: "Liked Songs",
      kind: "Playlist",
      owner: "You",
      fetchDetail: false,
      tracks: [{ id: "b" }],
    });
  });

  it("prefers the provider-backed liked playlist after login", () => {
    expect(
      likedSongsOpenTarget({
        catalog: catalog([track("local")]),
        liked: new Set(["local"]),
        loggedIn: true,
        userPlaylists: [playlist("real")],
      }),
    ).toMatchObject({ id: "real", kind: "Playlist" });

    expect(
      likedSongsOpenTarget({
        catalog: catalog([track("local")]),
        liked: new Set(["local"]),
        loggedIn: false,
        userPlaylists: [playlist("real")],
      }),
    ).toMatchObject({ id: "liked", tracks: [{ id: "local" }] });
  });
});
