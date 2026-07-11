import { describe, expect, it } from "vitest";

import { ProviderId } from "./provider";

describe("ProviderId", () => {
  it("accepts stable lowercase machine ids", () => {
    expect(ProviderId.of("netease")).toBe("netease");
    expect(ProviderId.of("future-source-2")).toBe("future-source-2");
  });

  it.each(["", "Netease", "qq_music", " local", "local ", "two--parts"])(
    "rejects unstable id %j",
    (value) => {
      expect(() => ProviderId.of(value)).toThrow("Invalid provider id");
    },
  );
});
