import type { KyInstance } from "ky";

import type { Account, CredentialStore, LoginFlow, LoginStatus } from "@domain";

import { coverSet } from "./mapper";
import type {
  NcmAccountResponse,
  NcmQrCheckResponse,
  NcmQrCreateResponse,
  NcmQrKeyResponse,
  NcmUserDetailResponse,
} from "./types";

export async function beginNcmLogin(
  http: KyInstance,
  credentials: CredentialStore | undefined,
  providerName: string,
): Promise<LoginFlow> {
  const keyRes = await http
    .get("login/qr/key", { searchParams: { timestamp: Date.now() } })
    .json<NcmQrKeyResponse>();
  const key = keyRes.data?.unikey ?? "";
  const createRes = await http
    .get("login/qr/create", { searchParams: { key, qrimg: true, timestamp: Date.now() } })
    .json<NcmQrCreateResponse>();

  return {
    kind: "qr",
    image: createRes.data?.qrimg ?? "",
    poll: async (): Promise<LoginStatus> => {
      const res = await http
        .get("login/qr/check", { searchParams: { key, timestamp: Date.now() } })
        .json<NcmQrCheckResponse>()
        .catch((): NcmQrCheckResponse => ({}));
      if (res.code === 803) {
        if (res.cookie) credentials?.set(providerName, { token: res.cookie });
        return { state: "authorized" };
      }
      if (res.code === 802) return { state: "scanned" };
      if (res.code === 800) return { state: "expired" };
      return { state: "pending" };
    },
  };
}

export async function fetchNcmAccount(http: KyInstance): Promise<Account> {
  const res = await http
    .get("user/account", { searchParams: { timestamp: Date.now() } })
    .json<NcmAccountResponse>();
  const profile = res.profile ?? {};
  const id = (profile.userId ?? "").toString();
  const detail = id
    ? await http
        .get("user/detail", { searchParams: { uid: id, timestamp: Date.now() } })
        .json<NcmUserDetailResponse>()
        .catch((): NcmUserDetailResponse => ({}))
    : {};
  const detailProfile = detail.profile ?? {};
  return {
    id,
    name: profile.nickname ?? "",
    avatar: coverSet(profile.avatarUrl),
    vip: (res.account?.vipType ?? 0) > 0,
    followers: detailProfile.followeds ?? profile.followeds,
    following: detailProfile.follows ?? profile.follows,
  };
}

export async function fetchNcmUid(http: KyInstance): Promise<string> {
  const res = await http
    .get("user/account", { searchParams: { timestamp: Date.now() } })
    .json<NcmAccountResponse>();
  return (res.profile?.userId ?? "").toString();
}

export async function logoutNcm(
  http: KyInstance,
  credentials: CredentialStore | undefined,
  providerName: string,
): Promise<void> {
  await http.get("logout", { searchParams: { timestamp: Date.now() } }).catch(() => {});
  credentials?.clear(providerName);
}
