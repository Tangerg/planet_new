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
