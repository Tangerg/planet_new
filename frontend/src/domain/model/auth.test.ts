import { describe, expect, it } from "vitest";

import { AuthSession } from "./auth";

describe("AuthSession", () => {
  it("constructs and restores a non-empty opaque credential", () => {
    expect(AuthSession.of(" SESSION=1 ")).toEqual({ token: " SESSION=1 " });
    expect(AuthSession.parse({ token: "token" })).toEqual({ token: "token" });
  });

  it("rejects empty or malformed persisted values", () => {
    expect(() => AuthSession.of("  ")).toThrow(/must not be empty/);
    expect(AuthSession.parse(null)).toBeNull();
    expect(AuthSession.parse({})).toBeNull();
    expect(AuthSession.parse({ token: "" })).toBeNull();
    expect(AuthSession.parse({ token: 42 })).toBeNull();
  });
});
