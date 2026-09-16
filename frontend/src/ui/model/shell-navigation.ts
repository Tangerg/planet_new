import { LAUNCHER_VIEW, type ShellScreenView } from "@/model/shell-screen";
import type {
  ArtistTarget,
  CollectionViewMode,
  DetailTarget,
  LibrarySectionTab,
  VibeMusicVideo,
  VibeTrack,
} from "@/model/vibe";

export type NavSnapshot<TLastTile> = {
  view: ShellScreenView;
  detail: DetailTarget | null;
  artistObj: ArtistTarget;
  musicVideoObj: VibeMusicVideo | null;
  musicVideoRelated: VibeMusicVideo[];
  libraryTab: LibrarySectionTab;
  libraryView: CollectionViewMode;
  searchQuery: string;
  playContext: VibeTrack[];
  lastTile: TLastTile | null;
};

export function isLauncherSnapshot(snapshot: Pick<NavSnapshot<unknown>, "view">): boolean {
  return snapshot.view === LAUNCHER_VIEW;
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
