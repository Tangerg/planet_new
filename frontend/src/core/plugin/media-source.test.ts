import { describe, expect, it, vi } from "vitest";

import type { MediaAnalysisSourceResolver } from "./media-source";
import { directMediaAnalysisSource, resolveAnalysisSourceUrl } from "./media-source";

describe("media source gateway", () => {
  it("keeps direct analysis sources unchanged", async () => {
    await expect(resolveAnalysisSourceUrl(directMediaAnalysisSource, "provider:url")).resolves.toBe(
      "provider:url",
    );
  });

  it("uses the analysis resolver when one is configured", async () => {
    const resolveAnalysisSource: MediaAnalysisSourceResolver = vi.fn<
      (playUrl: string) => Promise<string>
    >(async () => "analysis:url");

    await expect(resolveAnalysisSourceUrl(resolveAnalysisSource, "provider:url")).resolves.toBe(
      "analysis:url",
    );

    expect(resolveAnalysisSource).toHaveBeenCalledWith("provider:url");
  });

  it("falls back to the original provider URL on empty or failed resolution", async () => {
    const emptyResolver: MediaAnalysisSourceResolver = vi.fn<(playUrl: string) => string>(() => "");
    const failingResolver: MediaAnalysisSourceResolver = vi.fn<
      (playUrl: string) => Promise<string>
    >(async () => {
      throw new Error("proxy down");
    });

    await expect(resolveAnalysisSourceUrl(emptyResolver, "provider:url")).resolves.toBe(
      "provider:url",
    );
    await expect(resolveAnalysisSourceUrl(failingResolver, "provider:url")).resolves.toBe(
      "provider:url",
    );
  });
});
