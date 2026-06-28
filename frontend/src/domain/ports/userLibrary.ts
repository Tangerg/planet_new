import type { Playlist } from "../model/playlist";
import type { Track } from "../model/track";

/**
 * Account-scoped library — the logged-in user's own data. Orthogonal to
 * MusicProvider/AuthProvider; implemented only by providers that expose it
 * (gated by the "userLibrary" capability) and only meaningful while logged in.
 */
export interface UserLibrary {
  /** Ids of every track the user has liked ("我喜欢的音乐"). */
  likedTrackIds(): Promise<string[]>;
  /** Like or unlike a track on the account. */
  setLiked(trackId: string, liked: boolean): Promise<void>;
  /** The user's own + subscribed playlists (stubs; tracks fetched on open). The
   *  first is conventionally the "liked songs" playlist. */
  userPlaylists(): Promise<Playlist[]>;
  /** The user's play record — most-played tracks over the last week ("week") or
   *  all time ("all"). Partial tracks (display fields only). */
  playRecord(period: "week" | "all"): Promise<Partial<Track>[]>;
  /** The day's personalised song recommendations ("每日推荐"). */
  dailyRecommendations(): Promise<Partial<Track>[]>;
}
