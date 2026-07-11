import { beforeEach, describe, expect, it } from "vitest";

import { ProviderId } from "@contexts/contracts";
import { AuthSession } from "@contexts/identity";
import { LocalCredentialStore } from "./credentials";

const PROVIDER_ID = ProviderId.of("test");
const STORAGE_KEY = "planet.auth.test";

describe("LocalCredentialStore", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips validated sessions by stable provider id", () => {
    const store = new LocalCredentialStore();
    store.set(PROVIDER_ID, AuthSession.of("token"));

    expect(store.get(PROVIDER_ID)).toEqual({ token: "token" });
    store.clear(PROVIDER_ID);
    expect(store.get(PROVIDER_ID)).toBeNull();
  });

  it("rejects and removes corrupt persisted identity state", () => {
    const store = new LocalCredentialStore();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "" }));

    expect(store.get(PROVIDER_ID)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
