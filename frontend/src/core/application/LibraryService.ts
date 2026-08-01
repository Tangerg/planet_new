import type { Playlist, TrackSnapshot } from "@domain";
import type {
  ActiveUserLibrarySource,
  UserLibrary,
  UserLibrarySourcePort,
} from "@domain/ports/user-library";
import { QueryFailedError, QueryResult, type QueryResult as Result } from "./QueryResult";

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

  private async read<T>(
    source: ActiveUserLibrarySource,
    operation: string,
    read: (library: UserLibrary) => Promise<T>,
  ): Promise<Result<T>> {
    if (!source.library) return QueryResult.unsupported();
    try {
      return QueryResult.success(await read(source.library));
    } catch (cause) {
      return QueryResult.failed(new QueryFailedError(source.diagnosticName, operation, { cause }));
    }
  }
}
