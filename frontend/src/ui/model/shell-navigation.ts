import type { ArtistTarget, DetailTarget, VibeMusicVideo, VibeTrack } from "@/model/vibe";

/** One frame of navigation state — enough to rebuild any screen on "back". */
export type NavSnapshot<TLastTile> = {
  view: string;
  detail: DetailTarget | null;
  artistObj: ArtistTarget;
  musicVideoObj: VibeMusicVideo | null;
  musicVideoRelated: VibeMusicVideo[];
  libraryTab: string;
  libraryView: string;
  searchQuery: string;
  playContext: VibeTrack[];
  lastTile: TLastTile | null;
};

export function isLauncherSnapshot(snapshot: Pick<NavSnapshot<unknown>, "view">): boolean {
  return snapshot.view === "xmb";
}

export function createNavSnapshot<TLastTile>(
  snapshot: NavSnapshot<TLastTile>,
): NavSnapshot<TLastTile> {
  return {
    ...snapshot,
    musicVideoRelated: [...snapshot.musicVideoRelated],
    playContext: [...snapshot.playContext],
  };
}
