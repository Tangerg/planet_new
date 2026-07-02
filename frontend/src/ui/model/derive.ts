// ============================================================
// Presentation-derivation: pure view-model transforms that several screens
// repeated inline (CoverFlow item shaping, History grouping, track sorting,
// Library sub/meta labels). Keeping them here makes the screens declarative and
// the logic unit-testable, separate from rendering.
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

/** Row meta (right-aligned count/year) for a library collection, per tab. */
export function collectionMeta(c: VibeCollection, tab: string): string {
  const count = c.trackCount ?? c.tracks?.length ?? 0;
  if (tab === "albums") return [c.year, `${count} tracks`].filter(Boolean).join(" · ");
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
 * Group play history into Today / This week / All-time. "Today" is this
 * session's plays (newest first, consecutive dupes dropped); "week" and
 * "earlier" come from the account's real play record (NCM /user/record — most
 * played last week / all time). Each track appears in only the earliest bucket
 * it qualifies for. Anonymous → only "today" (the account record is empty).
 */
export function groupHistory(
  session: VibeTrack[],
  week: VibeTrack[],
  all: VibeTrack[],
): HistoryGroups {
  const today: VibeTrack[] = [];
  for (let i = session.length - 1; i >= 0; i--) {
    const t = session[i];
    if (!t) continue;
    if (today.length && today[today.length - 1].id === t.id) continue;
    today.push(t);
  }
  const seen = new Set(today.map((t) => t.id));
  const dedupe = (xs: VibeTrack[]): VibeTrack[] => {
    const out: VibeTrack[] = [];
    for (const t of xs) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
    }
    return out;
  };
  const weekOut = dedupe(week);
  const earlier = dedupe(all);
  return {
    today,
    week: weekOut,
    earlier,
    total: today.length + weekOut.length + earlier.length,
    hero: today[0] || weekOut[0] || earlier[0],
  };
}
