import { describe, expect, test } from "vitest";

import { Account } from "./account";

describe("Account", () => {
  test("uses a fallback display name when provider name is blank", () => {
    expect(Account.displayName({ id: "u1", name: "  " }, "Local listener")).toBe("Local listener");
    expect(Account.displayName({ id: "u1", name: "Tangerg" })).toBe("Tangerg");
  });

  test("normalizes relationship counts to non-negative numbers", () => {
    expect(Account.followerCount({ id: "u1", name: "A", followers: -3 })).toBe(0);
    expect(Account.followingCount({ id: "u1", name: "A", following: 12 })).toBe(12);
  });
});
