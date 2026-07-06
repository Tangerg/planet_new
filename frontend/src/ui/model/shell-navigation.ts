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

/**
 * Back-stack with launcher semantics baked in: the XMB root is the boundary
 * handled by the morph engine, so it never enters history.
 */
export class NavigationHistory<TLastTile> {
  private snapshots: NavSnapshot<TLastTile>[] = [];

  get size(): number {
    return this.snapshots.length;
  }

  push(snapshot: NavSnapshot<TLastTile> | null | undefined): void {
    if (!snapshot || isLauncherSnapshot(snapshot)) return;
    this.snapshots.push(createNavSnapshot(snapshot));
  }

  pop(): NavSnapshot<TLastTile> | null {
    const snapshot = this.snapshots.pop();
    return snapshot ? createNavSnapshot(snapshot) : null;
  }

  clear(): void {
    this.snapshots = [];
  }
}

/**
 * A tiny generation gate for async navigation backfills. Opening another screen
 * or leaving the current one invalidates older fetches so late detail responses
 * cannot overwrite the active screen.
 */
export class NavigationRequestGate {
  private generation = 0;

  start(): number {
    this.generation += 1;
    return this.generation;
  }

  cancel(): void {
    this.generation += 1;
  }

  accepts(ticket: number): boolean {
    return ticket === this.generation;
  }
}

/**
 * Cohesive navigation transaction boundary: history and async freshness are two
 * sides of the same shell navigation session. Hooks decide how to render/apply a
 * transition; this object decides how a navigation intent affects back-stack and
 * pending async backfills.
 */
export class NavigationSession<TLastTile> {
  private readonly history = new NavigationHistory<TLastTile>();
  private readonly requests = new NavigationRequestGate();

  get historySize(): number {
    return this.history.size;
  }

  beginForward(snapshot: NavSnapshot<TLastTile> | null | undefined): void {
    this.requests.cancel();
    this.history.push(snapshot);
  }

  beginAsyncScreen(snapshot: NavSnapshot<TLastTile> | null | undefined): number {
    const ticket = this.requests.start();
    this.history.push(snapshot);
    return ticket;
  }

  beginAsyncBackfill(): number {
    return this.requests.start();
  }

  beginBack(): NavSnapshot<TLastTile> | null {
    this.requests.cancel();
    return this.history.pop();
  }

  beginHome(): void {
    this.requests.cancel();
    this.history.clear();
  }

  accepts(ticket: number): boolean {
    return this.requests.accepts(ticket);
  }
}
