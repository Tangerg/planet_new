import { sameVibeTrack, vibeTrackKey, type VibeTrack } from "./vibe";

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
): readonly VibeTrack[] {
  if (!track || !vibeTrackKey(track)) return history;
  if (sameVibeTrack(history[history.length - 1], track)) return history;
  return [...history, track];
}

export function groupPlayHistory(
  session: readonly VibeTrack[],
  week: readonly VibeTrack[],
  all: readonly VibeTrack[],
): HistoryGroups {
  const today: VibeTrack[] = [];
  for (let i = session.length - 1; i >= 0; i--) {
    const track = session[i];
    if (!track) continue;
    if (!vibeTrackKey(track)) continue;
    if (today.length && sameVibeTrack(today[today.length - 1], track)) continue;
    today.push(track);
  }

  const seen = new Set(today.map(vibeTrackKey).filter((key) => key !== undefined));
  const dedupe = (tracks: readonly VibeTrack[]): VibeTrack[] => {
    const out: VibeTrack[] = [];
    for (const track of tracks) {
      const key = vibeTrackKey(track);
      if (!key || seen.has(key)) continue;
      seen.add(key);
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
