import type { VibeTrack } from "./vibe";

export type HistoryGroups = {
  today: VibeTrack[];
  week: VibeTrack[];
  earlier: VibeTrack[];
  total: number;
  hero?: VibeTrack;
};

export function appendPlayHistoryTrack(
  history: readonly VibeTrack[],
  track: VibeTrack | undefined,
): VibeTrack[] {
  if (!track?.id) return [...history];
  return history[history.length - 1]?.id === track.id ? [...history] : [...history, track];
}

/**
 * Group play history into Today / This week / All-time. "Today" is this
 * session's plays (newest first, consecutive dupes dropped); "week" and
 * "earlier" come from the account's real play record. Each track appears in
 * only the earliest bucket it qualifies for.
 */
export function groupPlayHistory(
  session: VibeTrack[],
  week: VibeTrack[],
  all: VibeTrack[],
): HistoryGroups {
  const today: VibeTrack[] = [];
  for (let i = session.length - 1; i >= 0; i--) {
    const track = session[i];
    if (!track) continue;
    if (today.length && today[today.length - 1].id === track.id) continue;
    today.push(track);
  }

  const seen = new Set(today.map((track) => track.id));
  const dedupe = (tracks: VibeTrack[]): VibeTrack[] => {
    const out: VibeTrack[] = [];
    for (const track of tracks) {
      if (seen.has(track.id)) continue;
      seen.add(track.id);
      out.push(track);
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
