import type { Playlist } from "../model/playlist";
import type { TrackSnapshot } from "../model/track";
import type { ProviderId } from "../model/provider-id";

/**
 * Account-scoped library — the logged-in user's own data. Orthogonal to
 * Catalog/IdentityGateway/Engagement; implemented only by providers that expose
 * the port and only meaningful while logged in.
 */
export interface UserLibrary {
  /** The user's own + subscribed playlists (stubs; tracks fetched on open). The
   *  first is conventionally the "liked songs" playlist. */
  userPlaylists(): Promise<Playlist[]>;
  /** The day's personalised song recommendations ("每日推荐"). */
  dailyRecommendations(): Promise<TrackSnapshot[]>;
}

export type ActiveUserLibrarySource = Readonly<{
  providerId: ProviderId;
  diagnosticName: string;
  library: UserLibrary | null;
}>;

export interface UserLibrarySourcePort {
  active(): ActiveUserLibrarySource;
}
