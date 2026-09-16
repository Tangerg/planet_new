import type { Image } from "@contexts/catalog";

import type { LocalizedText } from "@/i18n/text";

import type { LibrarySectionTab, VibeTrack, VibeCollection } from "./vibe";

export type FlowItem<T extends VibeTrack | VibeCollection = VibeTrack | VibeCollection> = {
  id: string;
  name: string;
  sub?: string;
  seed: number;
  grad?: string[];
  image?: string;
  images?: Image[];
  obj: T;
};

export function trackFlowItems(tracks: VibeTrack[]): FlowItem<VibeTrack>[] {
  return tracks.map((t) => ({
    id: t.id,
    name: t.title,
    sub: t.artist,
    seed: t.coverSeed,
    grad: t.gradient,
    image: t.image,
    images: t.images,
    obj: t,
  }));
}

export function collectionFlowItems(
  items: VibeCollection[],
  sub: (c: VibeCollection) => string,
): FlowItem<VibeCollection>[] {
  return items.map((c) => ({
    id: c.id,
    name: c.name,
    sub: sub(c),
    seed: c.coverSeed,
    grad: c.gradient,
    image: c.image,
    images: c.images,
    obj: c,
  }));
}

export function collectionSub(c: VibeCollection, tab: LibrarySectionTab): LocalizedText {
  if (tab === "albums") return { text: c.artist ?? "" };
  if (tab === "artists") return { text: "" };
  return { key: "common.playlist" };
}

export function collectionTrackCount(c: Pick<VibeCollection, "trackCount" | "tracks">): number {
  return c.trackCount ?? c.tracks?.length ?? 0;
}

export function collectionMeta(c: VibeCollection, tab: LibrarySectionTab): LocalizedText[] {
  if (tab === "artists") return [];
  const count: LocalizedText = { key: "counts.tracks", values: { count: collectionTrackCount(c) } };
  return tab === "albums" ? [{ text: c.year ? String(c.year) : "" }, count] : [count];
}

export type SortMode = "order" | "title" | "duration";
export type SortedTrack = { t: VibeTrack; i: number };

export function sortTracks(tracks: VibeTrack[], sort: SortMode): SortedTrack[] {
  const xs = tracks.map((t, i) => ({ t, i }));
  if (sort === "title") xs.sort((a, b) => a.t.title.localeCompare(b.t.title));
  else if (sort === "duration") xs.sort((a, b) => (a.t.durSec || 0) - (b.t.durSec || 0));
  return xs;
}
