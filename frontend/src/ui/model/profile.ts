import { Account, type AccountSnapshot } from "@contexts/identity";
import { compactCount } from "@shared/number";

import type { LocalizedText, MessageKey } from "@/i18n/text";

import { collectionTrackCount } from "./derive";
import type { VibeCollection } from "./vibe";

export type ProfilePlaylistItem = {
  active: boolean;
  playlist: VibeCollection;
  trackCount: number;
};

/** Follower/following counts, present only for a real connected account — an
 *  anonymous profile has no social graph to report and must not invent one. */
export type ProfileSocialCounts = Readonly<{ followers: string; following: string }>;

export type ProfileScreenModel = {
  authActionKey?: MessageKey;
  connectionKey: MessageKey;
  social?: ProfileSocialCounts;
  name: LocalizedText;
  /** Whether to show the account-level membership mark (a real connected premium account). */
  membership: boolean;
  playlists: ProfilePlaylistItem[];
};

export function profileConnectionKey(loggedIn: boolean, supported: boolean): MessageKey {
  if (loggedIn) return "profile.connected";
  if (supported) return "profile.notConnected";
  return "profile.localProfile";
}

export function profileAuthActionKey(
  loggedIn: boolean,
  supported: boolean,
): MessageKey | undefined {
  if (!supported) return undefined;
  return loggedIn ? "profile.logout" : "profile.login";
}

export function profileSocialCounts(
  account: AccountSnapshot | null | undefined,
  loggedIn: boolean,
): ProfileSocialCounts | undefined {
  if (!loggedIn || !account) return undefined;
  return {
    followers: compactCount(Account.followerCount(account)),
    following: compactCount(Account.followingCount(account)),
  };
}

/** Account-level membership mark: only for a real connected account with a paid tier
 *  (never on the anonymous demo profile). Distinct from a track's per-song VIP badge. */
export function profileMembership(
  account: AccountSnapshot | null | undefined,
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
  account: AccountSnapshot | null | undefined;
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
  const accountName = account?.name?.trim();
  return {
    authActionKey: profileAuthActionKey(loggedIn, supported),
    connectionKey: profileConnectionKey(loggedIn, supported),
    social: profileSocialCounts(account, loggedIn),
    name: accountName ? { text: accountName } : { key: "profile.anonymous" },
    membership: profileMembership(account, loggedIn),
    playlists: profilePlaylistItems(playlists, activePlaylistIndex),
  };
}
