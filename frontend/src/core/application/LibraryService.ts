import type { MusicProvider, Playlist, UserLibrary } from "@domain";

/**
 * Application service for the logged-in user's own library (liked songs, …).
 * Bound to the active provider; callers gate on `supported` + login state
 * (AuthService.isLoggedIn). Never imports React or `@providers`.
 */
export class LibraryService {
  constructor(private readonly getProvider: () => MusicProvider) {}

  /** Whether the active provider exposes account library at all. */
  get supported(): boolean {
    return this.getProvider().supports("userLibrary");
  }

  private lib(): UserLibrary {
    const provider = this.getProvider();
    if (!provider.supports("userLibrary")) {
      throw new Error(`Provider ${provider.name} has no user library.`);
    }
    return provider as unknown as UserLibrary;
  }

  likedTrackIds(): Promise<string[]> {
    return this.lib().likedTrackIds();
  }

  setLiked(trackId: string, liked: boolean): Promise<void> {
    return this.lib().setLiked(trackId, liked);
  }

  userPlaylists(): Promise<Playlist[]> {
    return this.lib().userPlaylists();
  }
}
