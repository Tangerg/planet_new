import type { KyInstance } from "ky";

import {
  AuthSession,
  type Account,
  type CredentialStore,
  type LoginFlow,
  type LoginStatus,
  type ProviderId,
} from "@domain";

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
  providerId: ProviderId,
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
        if (res.cookie) credentials?.set(providerId, AuthSession.of(res.cookie));
        return { state: "authorized" };
      }
      if (res.code === 802) return { state: "scanned" };
      if (res.code === 800) return { state: "expired" };
      return { state: "pending" };
    },
  };
}

export async function fetchNcmAccount(http: KyInstance): Promise<Account | undefined> {
  const res = await http
    .get("user/account", { searchParams: { timestamp: Date.now() } })
    .json<NcmAccountResponse>();
  const profile = res.profile ?? {};
  const id = (profile.userId ?? "").toString();
  if (!id) return undefined;
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
    // Map NCM's raw "vipType" noun to the neutral domain field.
    premium: (res.account?.vipType ?? 0) > 0,
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

export async function logoutNcm(http: KyInstance): Promise<void> {
  await http.get("logout", { searchParams: { timestamp: Date.now() } });
}
