import { describe, expect, it } from "vitest";

import { accountQueryEnabled } from "./account-query";

describe("account query model", () => {
  it.each([
    { loggedIn: true, authSupported: true, expected: true },
    { loggedIn: true, authSupported: false, expected: false },
    { loggedIn: false, authSupported: true, expected: false },
    { loggedIn: false, authSupported: false, expected: false },
  ])(
    "enables account reads only when loggedIn=$loggedIn and authSupported=$authSupported",
    ({ loggedIn, authSupported, expected }) => {
      expect(accountQueryEnabled({ loggedIn, authSupported })).toBe(expected);
    },
  );
});
