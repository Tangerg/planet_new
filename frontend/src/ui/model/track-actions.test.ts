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
import { ProviderId } from "@domain/model/provider-id";
import { TrackKey } from "@domain/model/entity-key";

const TEST_PROVIDER_ID = ProviderId.of("test");
const OTHER_PROVIDER_ID = ProviderId.of("other");

const track = (id: string, providerId = TEST_PROVIDER_ID): VibeTrack => ({
  providerId,
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
  kind: "playlist",
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
    expect(
      playbackContextForTrack(track("selected", OTHER_PROVIDER_ID), context).map(
        (item) => item.providerId,
      ),
    ).toEqual([OTHER_PROVIDER_ID]);
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
    expect(findQueueTrack(TrackKey.of(TEST_PROVIDER_ID, "queue"), context)?.id).toBe("queue");
    expect(findQueueTrack(TrackKey.of(TEST_PROVIDER_ID, "missing"), context)).toBeUndefined();
  });

  it("keeps the drag payload contract for queue drops in one place", () => {
    const store = new Map<string, string>();
    const dataTransfer = {
      setData: (type: string, value: string) => store.set(type, value),
      getData: (type: string) => store.get(type) ?? "",
    };

    writeTrackDragData(dataTransfer, track("track-1"));

    expect(store.get(TRACK_DRAG_MIME)).toBe(TrackKey.of(TEST_PROVIDER_ID, "track-1"));
    expect(canAcceptTrackDrag([TRACK_DRAG_MIME])).toBe(true);
    expect(canAcceptTrackDrag(["text/plain"])).toBe(false);
    expect(readTrackDragData(dataTransfer)).toBe(TrackKey.of(TEST_PROVIDER_ID, "track-1"));

    store.set(TRACK_DRAG_MIME, "   ");
    expect(readTrackDragData(dataTransfer)).toBeNull();
  });

  it("builds the anonymous liked songs collection from catalog tracks", () => {
    const liked = syntheticLikedSongsCollection(
      catalog([track("a"), track("b")]),
      new Set([TrackKey.of(TEST_PROVIDER_ID, "b")]),
    );

    expect(liked).toMatchObject({
      id: "liked",
      name: "Liked Songs",
      kind: "playlist",
      owner: "You",
      fetchDetail: false,
      tracks: [{ id: "b" }],
    });
  });

  it("prefers the provider-backed liked playlist after login", () => {
    expect(
      likedSongsOpenTarget({
        catalog: catalog([track("local")]),
        liked: new Set([TrackKey.of(TEST_PROVIDER_ID, "local")]),
        loggedIn: true,
        userPlaylists: [playlist("real")],
      }),
    ).toMatchObject({ id: "real", kind: "playlist" });

    expect(
      likedSongsOpenTarget({
        catalog: catalog([track("local")]),
        liked: new Set([TrackKey.of(TEST_PROVIDER_ID, "local")]),
        loggedIn: false,
        userPlaylists: [playlist("real")],
      }),
    ).toMatchObject({ id: "liked", tracks: [{ id: "local" }] });
  });
});
