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
}
