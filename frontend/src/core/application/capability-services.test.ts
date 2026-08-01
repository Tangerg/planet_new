import { describe, expect, it, vi } from "vitest";

import { IdentityService } from "./IdentityService";
import { LibraryService } from "./LibraryService";
import {
  ProviderId,
  type Account,
  type CredentialStore,
  type IdentityGateway,
  type IdentitySourcePort,
  type LoginFlow,
  type LoginStatus,
  type Playlist,
  type TrackSnapshot,
  type UserLibrary,
  type UserLibrarySourcePort,
} from "@domain";

const TEST_PROVIDER_ID = ProviderId.of("test");

function makeCredentials(): CredentialStore {
  const sessions = new Map<string, { token: string }>();
  return {
    get: (provider) => sessions.get(provider) ?? null,
    set: (provider, session) => sessions.set(provider, session),
    clear: (provider) => sessions.delete(provider),
  };
}

function identitySources(identity: IdentityGateway | null): IdentitySourcePort {
  return {
    active: () => ({ providerId: TEST_PROVIDER_ID, diagnosticName: "test", identity }),
  };
}

function librarySources(library: UserLibrary | null): UserLibrarySourcePort {
  return {
    active: () => ({ providerId: TEST_PROVIDER_ID, diagnosticName: "test", library }),
  };
}

describe("IdentityService capability port", () => {
  it("rejects a source that registered no identity gateway", () => {
    const service = new IdentityService(identitySources(null), makeCredentials());

    expect(service.supported).toBe(false);
    expect(() => service.beginLogin()).toThrow("does not support identity");
  });

  it("uses the registered identity gateway", async () => {
    const flow: LoginFlow = {
      kind: "qr",
      image: "data:image/png;base64,qr",
      poll: vi.fn<() => Promise<LoginStatus>>(async () => ({ state: "pending" })),
    };
    const beginLogin = vi.fn<() => Promise<LoginFlow>>(async () => flow);
    const identity: IdentityGateway = {
      beginLogin,
      account: vi.fn<() => Promise<Account>>(async () => ({ id: "u1", name: "Ada", avatar: [] })),
      logout: vi.fn<() => Promise<void>>(async () => {}),
    };
    const service = new IdentityService(identitySources(identity), makeCredentials());

    await expect(service.beginLogin()).resolves.toBe(flow);
    expect(beginLogin).toHaveBeenCalledTimes(1);
    expect(service.supported).toBe(true);
    expect(service.providerId).toBe(TEST_PROVIDER_ID);
  });

  it("clears local identity state even when remote logout fails", async () => {
    const credentials = makeCredentials();
    credentials.set(TEST_PROVIDER_ID, { token: "session" });
    const identity: IdentityGateway = {
      beginLogin: vi.fn<IdentityGateway["beginLogin"]>(),
      account: vi.fn<IdentityGateway["account"]>(),
      logout: vi.fn<IdentityGateway["logout"]>(async () => {
        throw new Error("offline");
      }),
    };
    const service = new IdentityService(identitySources(identity), credentials);

    await expect(service.logout()).rejects.toThrow("offline");
    expect(service.isLoggedIn()).toBe(false);
  });
});

describe("LibraryService capability port", () => {
  it("distinguishes an unsupported library from successful empty data", async () => {
    const service = new LibraryService(librarySources(null));

    expect(service.supported).toBe(false);
    await expect(service.userPlaylists()).resolves.toEqual({ status: "unsupported" });
  });

  it("uses the registered user-library port", async () => {
    const userPlaylists = vi.fn<() => Promise<Playlist[]>>(async () => []);
    const library: UserLibrary = {
      userPlaylists,
      dailyRecommendations: vi.fn<() => Promise<TrackSnapshot[]>>(async () => []),
    };
    const service = new LibraryService(librarySources(library));

    await expect(service.userPlaylists()).resolves.toEqual({ status: "success", data: [] });
    expect(userPlaylists).toHaveBeenCalledTimes(1);
    expect(service.supported).toBe(true);
  });

  it("projects provider failures without losing their cause", async () => {
    const cause = new Error("offline");
    const service = new LibraryService(
      librarySources({
        userPlaylists: async () => {
          throw cause;
        },
        dailyRecommendations: async () => {
          throw cause;
        },
      }),
    );

    await expect(service.userPlaylists()).resolves.toMatchObject({
      status: "failed",
      error: { source: "test", operation: "userPlaylists", cause },
    });
    await expect(service.dailyRecommendations()).resolves.toMatchObject({
      status: "failed",
      error: { source: "test", operation: "dailyRecommendations", cause },
    });
  });
});
