import type { Image } from "./image";

/** The logged-in user of a provider (filled by an authenticated session). */
export type Account = {
  id: string;
  name: string;
  /** Avatar variants (largest-first), or empty when none. */
  avatar?: Image[];
  /** Whether the account has an active paid membership (provider-neutral; a mapper
   *  translates each provider's own noun — e.g. NCM's "VIP" — into this). */
  premium?: boolean;
  /** Follower count (people following this user), when the provider exposes it. */
  followers?: number;
  /** Following count (people this user follows), when the provider exposes it. */
  following?: number;
};

export type AccountSnapshot = Account;

export const Account = {
  displayName(account: Account | null | undefined, fallback = "Listener"): string {
    return account?.name?.trim() || fallback;
  },

  followerCount(account: Account | null | undefined): number {
    return Math.max(0, account?.followers ?? 0);
  },

  followingCount(account: Account | null | undefined): number {
    return Math.max(0, account?.following ?? 0);
  },

  hasMembership(account: Account | null | undefined): boolean {
    return account?.premium === true;
  },
};
