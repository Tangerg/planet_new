import { describe, expect, it, vi } from "vitest";

import {
  appMenuItems,
  collectionMenuItems,
  isMenuItem,
  trackMenuItems,
  type MenuItem,
} from "./menu";
import type { ArtistTarget, CardItem, VibeTrack } from "./vibe";
import { ProviderId } from "@domain/model/provider-id";
import { TrackKey } from "@domain/model/entity-key";

const TEST_PROVIDER_ID = ProviderId.of("test");

const track = (overrides: Partial<VibeTrack> = {}): VibeTrack => ({
  providerId: TEST_PROVIDER_ID,
  id: "track",
  title: "Track",
  name: "Track",
  artist: "Artist",
  coverSeed: 1,
  durSec: 10,
  duration: "0:10",
  ...overrides,
});

const card = (overrides: Partial<CardItem> = {}): CardItem => ({
  id: "card",
  name: "Card",
  coverSeed: 1,
  ...overrides,
});

const voidMock = () => vi.fn<() => void>();
const playMock = () => vi.fn<(track: VibeTrack) => void>();
const trackMock = () => vi.fn<(track: VibeTrack) => void>();
const trackIdMock = () => vi.fn<(trackId: string, next?: boolean) => void>();
const artistMock = () => vi.fn<(artist: ArtistTarget) => void>();
const cardMock = () => vi.fn<(item: CardItem) => void>();

/** Menu labels are message keys, so assertions read the key, not rendered text. */
const labelKey = (item: MenuItem): string =>
  item.label && "key" in item.label ? item.label.key : "sep";

describe("menu model", () => {
  it("filters optional menu entries with a type guard", () => {
    const open = { label: { key: "menu.open" } } as const;
    expect([open, false, null, undefined].filter(isMenuItem)).toEqual([open]);
  });

  it("builds track menus from playback, queue, like, and artist actions", () => {
    const onPlay = playMock();
    const enqueue = trackIdMock();
    const toggleLike = trackMock();
    const openArtist = artistMock();
    const items = trackMenuItems({
      track: track({ artistId: "artist" }),
      onPlay,
      enqueue,
      toggleLike,
      liked: new Set([TrackKey.of(TEST_PROVIDER_ID, "track")]),
      openArtist,
    });

    expect(items.map(labelKey)).toEqual([
      "menu.play",
      "menu.playNext",
      "menu.addToQueue",
      "sep",
      "menu.removeFromLiked",
      "menu.goToArtist",
    ]);
    items[0].onClick?.();
    items[1].onClick?.();
    items[2].onClick?.();
    items[4].onClick?.();
    items[5].onClick?.();
    expect(onPlay).toHaveBeenCalledWith(expect.objectContaining({ id: "track" }));
    expect(enqueue).toHaveBeenCalledWith(TrackKey.of(TEST_PROVIDER_ID, "track"), true);
    expect(enqueue).toHaveBeenCalledWith(TrackKey.of(TEST_PROVIDER_ID, "track"));
    expect(toggleLike).toHaveBeenCalledWith(expect.objectContaining({ id: "track" }));
    expect(openArtist).toHaveBeenCalledWith({ id: "artist", name: "Artist" });
  });

  it("omits artist actions when the item cannot navigate to an artist", () => {
    expect(
      trackMenuItems({
        track: track(),
        onPlay: playMock(),
        enqueue: trackIdMock(),
        toggleLike: trackMock(),
        liked: new Set(),
        openArtist: artistMock(),
      }).map(labelKey),
    ).not.toContain("menu.goToArtist");

    expect(
      collectionMenuItems({
        item: card({ artistId: "artist", artist: "Artist" }),
        openDetail: cardMock(),
        openArtist: artistMock(),
      }).map(labelKey),
    ).toEqual(["menu.open", "menu.goToArtist"]);
  });

  it("builds the app menu from navigation state", () => {
    const withoutBackOrQueue = appMenuItems({
      canGoBack: false,
      hasQueue: false,
      goBack: voidMock(),
      goHome: voidMock(),
      openSearch: voidMock(),
      openLibrary: voidMock(),
      openQueue: voidMock(),
      openProfile: voidMock(),
      openSettings: voidMock(),
    }).map(labelKey);

    const withBackAndQueue = appMenuItems({
      canGoBack: true,
      hasQueue: true,
      goBack: voidMock(),
      goHome: voidMock(),
      openSearch: voidMock(),
      openLibrary: voidMock(),
      openQueue: voidMock(),
      openProfile: voidMock(),
      openSettings: voidMock(),
    }).map(labelKey);

    expect(withoutBackOrQueue).toEqual([
      "menu.home",
      "sep",
      "menu.search",
      "menu.library",
      "sep",
      "menu.profile",
      "menu.settings",
    ]);
    expect(withBackAndQueue).toEqual([
      "menu.back",
      "menu.home",
      "sep",
      "menu.search",
      "menu.library",
      "menu.queue",
      "sep",
      "menu.profile",
      "menu.settings",
    ]);
  });
});
