import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { CollectionRow } from "@/components/cards/CollectionRow";
import { CoverCard } from "@/components/coverflow/CoverCard";
import { MediaCard } from "@/components/cards/MediaCard";
import { PlayerTrackIdentity } from "@/components/player-bar/PlayerTrackIdentity";
import { TrackCard } from "@/components/cards/TrackCard";
import { TrackRow } from "@/components/cards/TrackRow";
import type { CardItem, VibeTrack } from "@/model/vibe";
import { ProviderId } from "@domain/model/provider-id";

const mocks = vi.hoisted(() => ({
  morphOpen: vi.fn<(_event: unknown, options: { run?: () => void }) => void>(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: { name?: string }) => {
      if (key === "a11y.openNowPlaying") return "Open now playing";
      if (key === "a11y.playItem") return `Play ${params?.name ?? ""}`.trim();
      if (key === "a11y.like") return "Like";
      return key;
    },
  }),
}));

vi.mock("@/hooks/screenActions", () => ({
  useScreenActions: () => ({ trackMenu: vi.fn<() => void>(), collMenu: vi.fn<() => void>() }),
}));

vi.mock("@/hooks/useMorphOpen", () => ({
  useMorphOpen: () => mocks.morphOpen,
}));

vi.mock("@/hooks/usePlaybackPolicy", () => ({
  usePlaybackPolicy: () => undefined,
}));

const track: VibeTrack = {
  id: "track-1",
  name: "Song",
  title: "Song",
  artist: "Artist",
  artistId: "artist-1",
  artists: [{ id: "artist-1", name: "Artist" }],
  duration: "03:00",
  durSec: 180,
  coverSeed: 1,
  gradient: ["#111111", "#eeeeee"],
  image: "https://example.com/cover.jpg",
  images: [],
  playUrl: "https://example.com/song.mp3",
};

const item: CardItem = {
  id: "collection-1",
  name: "Collection",
  coverSeed: 2,
  gradient: ["#222222", "#dddddd"],
  image: "https://example.com/collection.jpg",
  images: [],
};

describe("interactive component boundaries", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  beforeEach(() => {
    mocks.morphOpen.mockImplementation((_event, options) => options.run?.());
  });

  it("keeps the player-bar artist action separate from opening Now Playing", () => {
    const onOpenNowPlaying = vi.fn<(element: HTMLElement) => void>();
    const onOpenArtist = vi.fn<(artist: { id: string; name: string }) => void>();

    render(
      <PlayerTrackIdentity
        track={track}
        onOpenNowPlaying={onOpenNowPlaying}
        onOpenArtist={onOpenArtist}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Artist" }));
    expect(onOpenArtist).toHaveBeenCalledWith({ id: "artist-1", name: "Artist" });
    expect(onOpenNowPlaying).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Open now playing" })[0]);
    expect(onOpenNowPlaying).toHaveBeenCalledTimes(1);
  });

  it("keeps grid-card artist links outside the play hit area", () => {
    const onPlay = vi.fn<(track: VibeTrack) => void>();
    const onOpenArtist = vi.fn<(artist: { id: string; name: string }) => void>();

    const { container } = render(
      <TrackCard track={track} onPlay={onPlay} onOpenArtist={onOpenArtist} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Artist" }));
    expect(onOpenArtist).toHaveBeenCalledWith({ id: "artist-1", name: "Artist" });
    expect(onPlay).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Play Song" })[0]);
    expect(onPlay).toHaveBeenCalledWith(track);

    fireEvent.click(container.firstElementChild!);
    expect(onPlay).toHaveBeenCalledTimes(2);
  });

  it("keeps Cover Flow play separate from cover activation", () => {
    const onActivate = vi.fn<() => void>();
    const onPlay = vi.fn<() => void>();

    render(
      <CoverCard
        item={{
          id: "flow-1",
          name: "Flow Song",
          sub: "Artist",
          seed: 1,
          grad: ["#111111", "#eeeeee"],
          image: "https://example.com/cover.jpg",
          obj: track,
        }}
        isCenter
        cover={180}
        showPlay
        transform={{ x: 0, tz: 0, ry: 0, sc: 1, op: 1, z: 1 }}
        onActivate={onActivate}
        onPlay={onPlay}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play Flow Song" }));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Flow Song" }));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("keeps media-card play separate from opening the collection", () => {
    const onOpen = vi.fn<() => void>();
    const onPlay = vi.fn<() => void>();

    const { container } = render(<MediaCard item={item} onOpen={onOpen} onPlay={onPlay} />);

    fireEvent.click(screen.getByRole("button", { name: "Play Collection" }));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Collection" })[0]);
    expect(onOpen).toHaveBeenCalledTimes(1);

    fireEvent.click(container.firstElementChild!);
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it("keeps collection-row play separate from opening the collection", () => {
    const onOpen = vi.fn<() => void>();
    const onPlay = vi.fn<() => void>();

    const { container } = render(
      <CollectionRow item={item} sub="PLAYLIST" onOpen={onOpen} onPlay={onPlay} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play Collection" }));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Collection" })[0]);
    expect(onOpen).toHaveBeenCalledTimes(1);

    fireEvent.click(container.firstElementChild!);
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it("keeps track-row artist and like actions separate from playing", () => {
    const onPlay = vi.fn<(track: VibeTrack) => void>();
    const onOpenArtist = vi.fn<(artist: { id: string; name: string }) => void>();
    const toggleLike = vi.fn<(track: VibeTrack) => void>();

    render(
      <TrackRow
        track={track}
        index={1}
        onPlay={onPlay}
        playing={false}
        liked={new Set()}
        toggleLike={toggleLike}
        onOpenArtist={onOpenArtist}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Artist" }));
    expect(onOpenArtist).toHaveBeenCalledWith({ id: "artist-1", name: "Artist" });
    expect(onPlay).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(toggleLike).toHaveBeenCalledWith(expect.objectContaining({ id: "track-1" }));
    expect(onPlay).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Play Song" })[0]);
    expect(onPlay).toHaveBeenCalledWith(track);
  });

  // Hover affordances are CSS (`.trow` in cards.css), so the row must ship the
  // hooks CSS needs — both leading glyphs mounted and the availability class on
  // the root. jsdom can't evaluate `:hover`, so this guards the contract rather
  // than the paint: if someone reintroduces a hover STATE, the play glyph stops
  // being rendered up-front and this fails.
  it("mounts both leading glyphs so the row's play affordance needs no state", () => {
    const { container } = render(
      <TrackRow
        track={track}
        index={7}
        onPlay={vi.fn<(track: VibeTrack) => void>()}
        playing={false}
        liked={new Set()}
        toggleLike={vi.fn<(track: VibeTrack) => void>()}
        onOpenArtist={vi.fn<(artist: { id: string; name: string }) => void>()}
      />,
    );

    const row = container.firstElementChild!;
    expect(row).toHaveClass("trow");
    expect(row).not.toHaveClass("is-unavailable");
    expect(row.querySelector(".trow-index")).toHaveTextContent("7");
    expect(row.querySelector(".trow-play")).not.toBeNull();
  });

  it("withholds the play glyph from a row that cannot be played", () => {
    const { container } = render(
      <TrackRow
        track={{
          ...track,
          source: {
            providerId: ProviderId.of("test"),
            id: "track-1",
            name: "Song",
            durationMs: 180_000,
            artists: [],
            available: false,
          },
        }}
        index={7}
        onPlay={vi.fn<(track: VibeTrack) => void>()}
        playing={false}
        liked={new Set()}
        toggleLike={vi.fn<(track: VibeTrack) => void>()}
        onOpenArtist={vi.fn<(artist: { id: string; name: string }) => void>()}
      />,
    );

    const row = container.firstElementChild!;
    expect(row).toHaveClass("is-unavailable");
    expect(row.querySelector(".trow-index")).toHaveTextContent("7");
    expect(row.querySelector(".trow-play")).toBeNull();
  });
});
