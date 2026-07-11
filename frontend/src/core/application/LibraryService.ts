import type { Playlist, TrackSnapshot } from "@domain";
import type { UserLibrarySourcePort } from "@domain/ports/userLibrary";

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

  private lib() {
    const source = this.sources.active();
    if (!source.library) {
      throw new Error(`Provider ${source.diagnosticName} has no user library.`);
    }
    return source.library;
  }

  userPlaylists(): Promise<Playlist[]> {
    return this.lib().userPlaylists();
  }

  dailyRecommendations(): Promise<TrackSnapshot[]> {
    return this.lib().dailyRecommendations();
  }
}
