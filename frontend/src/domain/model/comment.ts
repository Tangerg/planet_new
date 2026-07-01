import type { Image } from "./image";

/**
 * A user comment on a track (e.g. NetEase hot/recent comments). Providers
 * without a comment endpoint return [] (the capability is gated separately).
 */
export type Comment = {
  id: string;
  user: {
    name: string;
    /** Avatar variants (largest-first), or empty when none. */
    avatar?: Image[];
  };
  content: string;
  /** Like count ("点赞"). */
  likedCount: number;
  /** Posted-at, unix milliseconds. */
  time: number;
};

export const Comment = {
  /**
   * Merge prioritized comment threads, preserving the first occurrence of each
   * provider comment id. Useful for sources that return "hot" and "recent"
   * lanes separately while the player wants one compact discussion stream.
   */
  mergeThreads(
    primary: readonly Comment[] = [],
    secondary: readonly Comment[] = [],
    limit = 30,
  ): Comment[] {
    const seen = new Set<string>();
    const out: Comment[] = [];
    for (const comment of [...primary, ...secondary]) {
      if (!comment.id || seen.has(comment.id)) continue;
      seen.add(comment.id);
      out.push(comment);
      if (out.length >= Math.max(0, limit)) break;
    }
    return out;
  },
};
