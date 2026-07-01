import { describe, expect, test } from "vitest";

import { httpsUrl } from "./url";

describe("httpsUrl", () => {
  test("upgrades a leading http:// to https://", () => {
    expect(httpsUrl("http://cdn.example/a.jpg")).toBe("https://cdn.example/a.jpg");
  });

  test("leaves https and other schemes untouched", () => {
    expect(httpsUrl("https://cdn.example/a.jpg")).toBe("https://cdn.example/a.jpg");
    expect(httpsUrl("//cdn.example/a.jpg")).toBe("//cdn.example/a.jpg");
    expect(httpsUrl("data:image/png;base64,zz")).toBe("data:image/png;base64,zz");
  });

  test("only rewrites the scheme prefix, not http inside the path", () => {
    expect(httpsUrl("https://x/redirect?to=http://y")).toBe("https://x/redirect?to=http://y");
  });

  test("maps a missing url to an empty string", () => {
    expect(httpsUrl(undefined)).toBe("");
    expect(httpsUrl("")).toBe("");
  });
});
