// ============================================================
// Presentation-derivation: pure view-model transforms that several screens
// repeated inline (CoverFlow item shaping, track sorting, Library sub/meta
// labels). Keeping them here makes the screens declarative and the logic
// unit-testable, separate from rendering.
// ============================================================
import type { Image } from "@contexts/catalog";

import type { LocalizedText } from "@/i18n/text";

import type { VibeTrack, VibeCollection } from "./vibe";

// ── CoverFlow items ──────────────────────────────────────────────────

/** A CoverFlow card: cover fields + display name/sub + the source object. The
 *  source type is preserved through `T` so callers get their concrete object
 *  back (a track or a collection) without a cast. */
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

/** Tracks → flow cards (title as name, artist as sub). */
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

/** Collections → flow cards; the caller supplies the already-resolved subtitle. */
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

// ── Library collection labels ────────────────────────────────────────

/** Row subtitle for a library collection, per active tab. Artists carry their
 *  name in the title already, so their subtitle stays empty. */
export function collectionSub(c: VibeCollection, tab: string): LocalizedText {
  if (tab === "albums") return { text: c.artist ?? "" };
  if (tab === "artists") return { text: "" };
  return { key: "common.playlist" };
}

export function collectionTrackCount(c: Pick<VibeCollection, "trackCount" | "tracks">): number {
  return c.trackCount ?? c.tracks?.length ?? 0;
}

/** Row meta (right-aligned count/year) for a library collection, per tab. */
export function collectionMeta(c: VibeCollection, tab: string): LocalizedText[] {
  if (tab === "artists") return [];
  const count: LocalizedText = { key: "counts.tracks", values: { count: collectionTrackCount(c) } };
  return tab === "albums" ? [{ text: c.year ? String(c.year) : "" }, count] : [count];
}

// ── Track sorting (Detail) ───────────────────────────────────────────

export type SortMode = "order" | "title" | "duration";
export type SortedTrack = { t: VibeTrack; i: number };

/** Stable sort keeping the original 1-based index for display. */
export function sortTracks(tracks: VibeTrack[], sort: SortMode): SortedTrack[] {
  const xs = tracks.map((t, i) => ({ t, i }));
  if (sort === "title") xs.sort((a, b) => a.t.title.localeCompare(b.t.title));
  else if (sort === "duration") xs.sort((a, b) => (a.t.durSec || 0) - (b.t.durSec || 0));
  return xs;
}
