// ============================================================
// Presentation-derivation: pure view-model transforms that several screens
// repeated inline (CoverFlow item shaping, History grouping, track sorting,
// Library sub/meta labels). Keeping them here makes the screens declarative and
// the logic unit-testable, separate from rendering.
// ============================================================
import type { Image } from "@domain/model/image";
import type { VibeTrack, VibeCollection } from "./adapt";

// ── CoverFlow items ──────────────────────────────────────────────────

/** A CoverFlow card: cover fields + display name/sub + the source object. */
export type FlowItem = {
  id: string;
  name: string;
  sub?: string;
  seed: number;
  grad?: string[];
  image?: string;
  images?: Image[];
  obj: VibeTrack | VibeCollection;
};

/** Tracks → flow cards (title as name, artist as sub). */
export function trackFlowItems(tracks: VibeTrack[]): FlowItem[] {
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
): FlowItem[] {
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

/** Row meta (right-aligned count/year) for a library collection, per tab. */
export function collectionMeta(c: VibeCollection, tab: string): string {
  const count = c.tracks ? c.tracks.length : 0;
  if (tab === "albums") return `${c.year} · ${count} tracks`;
  if (tab === "artists") return "";
  return `${count} tracks`;
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

// ── Listening history grouping ───────────────────────────────────────

export type HistoryGroups = {
  today: VibeTrack[];
  week: VibeTrack[];
  earlier: VibeTrack[];
  total: number;
  hero?: VibeTrack;
};

/**
 * Group play history into Today / Week / Earlier. "Today" is the de-duplicated
 * recent plays (newest first); the other two are seeded from the catalog so the
 * page reads populated before much listening has happened (mock-era behaviour).
 */
export function groupHistory(
  history: VibeTrack[],
  all: VibeTrack[],
  currentSeed: number,
): HistoryGroups {
  const today: VibeTrack[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const t = history[i];
    if (!t) continue;
    if (today.length && today[today.length - 1].id === t.id) continue;
    today.push(t);
  }
  const seedStart = currentSeed + 3;
  const seeded: VibeTrack[] = [];
  for (let i = 0; seeded.length < 14 && i < all.length * 2; i++) {
    const t = all[(seedStart + i) % all.length];
    if (!t) continue;
    if (today.some((r) => r.id === t.id) || seeded.some((s) => s.id === t.id)) continue;
    seeded.push(t);
  }
  const week = seeded.slice(0, 7);
  const earlier = seeded.slice(7, 14);
  return {
    today,
    week,
    earlier,
    total: today.length + week.length + earlier.length,
    hero: today[0] || week[0] || all[0],
  };
}
