import { afterEach, describe, expect, it, vi } from "vitest";

import { warnReadFailure, warnWriteFailure } from "./debug";

describe("debug warnings", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("formats recoverable read and write failures consistently", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    warnReadFailure("provider.search", new Error("network"));
    warnWriteFailure("provider.setLiked(1)", "denied");

    expect(warn).toHaveBeenNthCalledWith(1, "[Planet warn]: provider.search read failed: network");
    expect(warn).toHaveBeenNthCalledWith(
      2,
      "[Planet warn]: provider.setLiked(1) write failed: denied",
    );
  });
});
