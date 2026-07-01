import type { Image } from "./image";

/** The logged-in user of a provider (filled by an authenticated session). */
export type Account = {
  id: string;
  name: string;
  /** Avatar variants (largest-first), or empty when none. */
  avatar?: Image[];
  /** Whether the account has an active membership (e.g. NCM VIP). */
  vip?: boolean;
  /** Follower count (people following this user), when the provider exposes it. */
  followers?: number;
  /** Following count (people this user follows), when the provider exposes it. */
  following?: number;
};

export const Account = {
  displayName(account: Partial<Account> | null | undefined, fallback = "Listener"): string {
    return account?.name?.trim() || fallback;
  },

  followerCount(account: Partial<Account> | null | undefined): number {
    return Math.max(0, account?.followers ?? 0);
  },

  followingCount(account: Partial<Account> | null | undefined): number {
    return Math.max(0, account?.following ?? 0);
  },

  hasMembership(account: Partial<Account> | null | undefined): boolean {
    return account?.vip === true;
  },
};
