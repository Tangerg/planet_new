import type { Playlist, TrackSnapshot } from "@domain";
import type {
  ActiveUserLibrarySource,
  UserLibrary,
  UserLibrarySourcePort,
} from "@domain/ports/user-library";
import { readPort, type QueryResult as Result } from "./QueryResult";

/**
 * Application service for browsing the logged-in user's saved library.
 * Likes and play history belong to EngagementService.
 * Bound to the active provider; callers gate on `supported` + login state
 * (IdentityService.isLoggedIn). Never imports React or `@providers`.
 */
export class LibraryService {
  constructor(private readonly sources: UserLibrarySourcePort) {}

  /** Whether the active provider exposes account library at all. */
  get supported(): boolean {
    return this.sources.active().library !== null;
  }

  userPlaylists(): Promise<Result<Playlist[]>> {
    const source = this.sources.active();
    return this.read(source, "userPlaylists", (library) => library.userPlaylists());
  }

  dailyRecommendations(): Promise<Result<TrackSnapshot[]>> {
    const source = this.sources.active();
    return this.read(source, "dailyRecommendations", (library) => library.dailyRecommendations());
  }

  private read<T>(
    source: ActiveUserLibrarySource,
    operation: string,
    read: (library: UserLibrary) => Promise<T>,
  ): Promise<Result<T>> {
    return readPort(source.library, { source: source.diagnosticName, operation }, read);
  }
}
