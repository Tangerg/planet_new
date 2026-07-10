import type { Account as DomainAccount } from "@domain/model/account";
import { Account } from "@domain/model/account";
import { compactCount } from "@shared/number";

import { collectionTrackCount } from "./derive";
import type { VibeCollection } from "./vibe";

export type ProfilePlaylistItem = {
  active: boolean;
  playlist: VibeCollection;
  trackCount: number;
};

export type ProfileScreenModel = {
  authActionLabel?: string;
  connectionLabel: string;
  followers: string;
  following: string;
  name: string;
  /** Whether to show the account-level membership mark (a real connected premium account). */
  membership: boolean;
  playlists: ProfilePlaylistItem[];
};

export function profileConnectionLabel(loggedIn: boolean, supported: boolean): string {
  if (loggedIn) return "Connected";
  if (supported) return "Not connected";
  return "Local profile";
}

export function profileAuthActionLabel(loggedIn: boolean, supported: boolean): string | undefined {
  if (!supported) return undefined;
  return loggedIn ? "Log out" : "Log in with NetEase";
}

export function profileFollowerLabel(
  account: Partial<DomainAccount> | null | undefined,
  loggedIn: boolean,
): string {
  return loggedIn && account ? compactCount(Account.followerCount(account)) : "598";
}

export function profileFollowingLabel(
  account: Partial<DomainAccount> | null | undefined,
  loggedIn: boolean,
): string {
  return loggedIn && account ? compactCount(Account.followingCount(account)) : "6";
}

/** Account-level membership mark: only for a real connected account with a paid tier
 *  (never on the anonymous demo profile). Distinct from a track's per-song VIP badge. */
export function profileMembership(
  account: Partial<DomainAccount> | null | undefined,
  loggedIn: boolean,
): boolean {
  return loggedIn && Account.hasMembership(account);
}

export function profilePlaylistItems(
  playlists: readonly VibeCollection[],
  activeIndex: number,
): ProfilePlaylistItem[] {
  return playlists.slice(0, 4).map((playlist, index) => ({
    active: index === activeIndex,
    playlist,
    trackCount: collectionTrackCount(playlist),
  }));
}

type ProfileModelInput = {
  account: Partial<DomainAccount> | null | undefined;
  activePlaylistIndex: number;
  loggedIn: boolean;
  playlists: readonly VibeCollection[];
  supported: boolean;
};

export function profileScreenModel({
  account,
  activePlaylistIndex,
  loggedIn,
  playlists,
  supported,
}: ProfileModelInput): ProfileScreenModel {
  return {
    authActionLabel: profileAuthActionLabel(loggedIn, supported),
    connectionLabel: profileConnectionLabel(loggedIn, supported),
    followers: profileFollowerLabel(account, loggedIn),
    following: profileFollowingLabel(account, loggedIn),
    name: Account.displayName(account, "Lily Tran"),
    membership: profileMembership(account, loggedIn),
    playlists: profilePlaylistItems(playlists, activePlaylistIndex),
  };
}
