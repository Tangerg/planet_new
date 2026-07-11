import { describe, expect, expectTypeOf, it } from "vitest";

import { ProviderId } from "./provider-id";
import { AlbumKey, ArtistKey, TrackKey } from "./entity-key";

const NETEASE = ProviderId.of("netease");

describe("source-qualified entity keys", () => {
  it("round-trips provider and provider-local ids without separator ambiguity", () => {
    const localId = "song:周杰伦/晴天?quality=lossless";
    const key = TrackKey.of(NETEASE, localId);

    expect(key).toBe(
      "netease:song%3A%E5%91%A8%E6%9D%B0%E4%BC%A6%2F%E6%99%B4%E5%A4%A9%3Fquality%3Dlossless",
    );
    expect(TrackKey.parse(key)).toEqual({ providerId: NETEASE, localId });
  });

  it("keeps identical local ids distinct across providers and entity kinds", () => {
    const qqmusic = ProviderId.of("qqmusic");

    expect(TrackKey.of(NETEASE, "42")).not.toBe(TrackKey.of(qqmusic, "42"));
    expect(TrackKey.of(NETEASE, "42")).toBe("netease:42");
    expect(AlbumKey.of(NETEASE, "42")).toBe("netease:42");
    expect(ArtistKey.of(NETEASE, "42")).toBe("netease:42");
    expectTypeOf(TrackKey.of(NETEASE, "42")).not.toEqualTypeOf(AlbumKey.of(NETEASE, "42"));
  });

  it.each(["", " ", " padded", "padded "])("rejects invalid local id %j", (localId) => {
    expect(() => TrackKey.of(NETEASE, localId)).toThrow("Entity local id");
  });

  it.each(["", "netease", ":42", "Netease:42", "netease:", "netease:%E0%A4%A"])(
    "rejects malformed serialized key %j",
    (serialized) => {
      expect(() => TrackKey.parse(serialized)).toThrow("key");
    },
  );
});
