// ============================================================
// Presentation-derivation: pure view-model transforms that several screens
// repeated inline (CoverFlow item shaping, track sorting, Library sub/meta
// labels). Keeping them here makes the screens declarative and the logic
// unit-testable, separate from rendering.
// ============================================================
import type { Image } from "@domain/model/image";
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

/** Collections → flow cards; `sub` derives the subtitle (year, kind, …). */
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

/** Row subtitle for a library collection, per active tab. */
export function collectionSub(c: VibeCollection, tab: string): string {
  if (tab === "albums") return c.artist ?? "";
  if (tab === "artists") return "";
  return c.kind || "Playlist";
}

export function trackCountLabel(count: number): string {
  return `${count} ${count === 1 ? "track" : "tracks"}`;
}

export function collectionTrackCount(c: Pick<VibeCollection, "trackCount" | "tracks">): number {
  return c.trackCount ?? c.tracks?.length ?? 0;
}

export function collectionTrackCountLabel(
  c: Pick<VibeCollection, "trackCount" | "tracks">,
): string {
  return trackCountLabel(collectionTrackCount(c));
}

/** Row meta (right-aligned count/year) for a library collection, per tab. */
export function collectionMeta(c: VibeCollection, tab: string): string {
  const count = collectionTrackCountLabel(c);
  if (tab === "albums") return [c.year, count].filter(Boolean).join(" · ");
  if (tab === "artists") return "";
  return count;
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
