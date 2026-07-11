import { describe, expect, test, vi } from "vitest";

import { ProviderId, type CredentialStore } from "@domain";

import { fakeKy } from "./fake-ky";
import { beginNcmLogin, fetchNcmAccount, fetchNcmUid, logoutNcm } from "./account";

const NETEASE_ID = ProviderId.of("netease");

const credentialStore = (): CredentialStore => ({
  get: vi.fn<CredentialStore["get"]>(() => null),
  set: vi.fn<CredentialStore["set"]>(),
  clear: vi.fn<CredentialStore["clear"]>(),
});

describe("beginNcmLogin", () => {
  test("returns a QR flow whose poll maps NCM status codes", async () => {
    const creds = credentialStore();
    const codes = [802, 800, 803];
    const { http } = fakeKy({
      "login/qr/key": { data: { unikey: "K" } },
      "login/qr/create": { data: { qrimg: "data:image/png;base64,zzz" } },
      // Successive poll() calls walk the codes list.
      "login/qr/check": () => {
        const code = codes.shift();
        return code === 803 ? { code, cookie: "SESSION=1" } : { code };
      },
    });

    const flow = await beginNcmLogin(http, creds, NETEASE_ID);
    expect(flow.kind).toBe("qr");
    if (flow.kind !== "qr") throw new Error("expected a qr flow");
    expect(flow.image).toBe("data:image/png;base64,zzz");

    expect(await flow.poll()).toEqual({ state: "scanned" });
    expect(await flow.poll()).toEqual({ state: "expired" });
    expect(await flow.poll()).toEqual({ state: "authorized" });
    // The cookie from the authorized poll is persisted under the stable provider id.
    expect(creds.set).toHaveBeenCalledWith("netease", { token: "SESSION=1" });
  });

  test("poll reports pending when the check request fails", async () => {
    const { http } = fakeKy({
      "login/qr/key": { data: { unikey: "K" } },
      "login/qr/create": { data: { qrimg: "x" } },
      "login/qr/check": () => {
        throw new Error("network");
      },
    });
    const flow = await beginNcmLogin(http, credentialStore(), NETEASE_ID);
    if (flow.kind !== "qr") throw new Error("expected a qr flow");
    expect(await flow.poll()).toEqual({ state: "pending" });
  });
});

describe("fetchNcmAccount", () => {
  test("prefers the detail profile's relationship counts", async () => {
    const { http } = fakeKy({
      "user/account": {
        profile: { userId: 42, nickname: "Tan", avatarUrl: "http://a", followeds: 1, follows: 2 },
        account: { vipType: 11 },
      },
      "user/detail": { profile: { followeds: 100, follows: 200 } },
    });
    const account = await fetchNcmAccount(http);
    expect(account).toMatchObject({
      id: "42",
      name: "Tan",
      premium: true,
      followers: 100,
      following: 200,
    });
  });

  test("falls back to the account profile counts when detail is empty", async () => {
    const { http } = fakeKy({
      "user/account": {
        profile: { userId: 42, nickname: "Tan", followeds: 1, follows: 2 },
        account: { vipType: 0 },
      },
      "user/detail": {},
    });
    const account = await fetchNcmAccount(http);
    expect(account).toMatchObject({ premium: false, followers: 1, following: 2 });
  });

  test("skips the detail request when there is no user id", async () => {
    const { http, calls } = fakeKy({ "user/account": { profile: {} } });
    const account = await fetchNcmAccount(http);
    expect(account).toBeUndefined();
    expect(calls.some((c) => c.path === "user/detail")).toBe(false);
  });
});

describe("fetchNcmUid", () => {
  test("stringifies the profile user id", async () => {
    const { http } = fakeKy({ "user/account": { profile: { userId: 7 } } });
    expect(await fetchNcmUid(http)).toBe("7");
  });

  test("returns an empty string when absent", async () => {
    const { http } = fakeKy({ "user/account": {} });
    expect(await fetchNcmUid(http)).toBe("");
  });
});

describe("logoutNcm", () => {
  test("hits the remote logout endpoint", async () => {
    const { http, calls } = fakeKy({ logout: {} });
    await logoutNcm(http);
    expect(calls.some((c) => c.path === "logout")).toBe(true);
  });

  test("propagates remote failure so the identity use case can report it after local cleanup", async () => {
    const { http } = fakeKy({
      logout: () => {
        throw new Error("logout unavailable");
      },
    });
    await expect(logoutNcm(http)).rejects.toThrow("logout unavailable");
  });
});
