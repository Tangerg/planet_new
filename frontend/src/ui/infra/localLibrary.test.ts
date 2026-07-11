import { beforeEach, describe, expect, it, vi } from "vitest";

import * as Library from "@wailsjs/go/backend/Library";
import { backend } from "@wailsjs/go/models";
import { scanLocalFolder } from "./localLibrary";

vi.mock("@wailsjs/go/backend/Library", () => ({
  PickAndScan: vi.fn<typeof Library.PickAndScan>(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  delete (window as unknown as { go?: object }).go;
});

describe("Local Library Wails adapter", () => {
  it("reports an unavailable bridge explicitly", async () => {
    await expect(scanLocalFolder()).resolves.toEqual({ status: "unavailable" });
    expect(Library.PickAndScan).not.toHaveBeenCalled();
  });

  it("preserves cancelled, partial and complete scan outcomes", async () => {
    (window as unknown as { go: object }).go = {};
    vi.mocked(Library.PickAndScan)
      .mockResolvedValueOnce(backend.ScanResult.createFrom({ status: "cancelled" }))
      .mockResolvedValueOnce(
        backend.ScanResult.createFrom({
          status: "partial",
          folder: "/music",
          scanned: 2,
          added: 1,
          total: 4,
          durationMs: 10,
        }),
      )
      .mockResolvedValueOnce(
        backend.ScanResult.createFrom({
          status: "complete",
          folder: "/music",
          scanned: 4,
          added: 2,
          total: 4,
          durationMs: 20,
        }),
      );

    await expect(scanLocalFolder()).resolves.toEqual({ status: "cancelled" });
    await expect(scanLocalFolder()).resolves.toMatchObject({ status: "partial", total: 4 });
    await expect(scanLocalFolder()).resolves.toMatchObject({ status: "complete", total: 4 });
  });

  it("rejects an unknown generated status instead of guessing", async () => {
    (window as unknown as { go: object }).go = {};
    vi.mocked(Library.PickAndScan).mockResolvedValue(
      backend.ScanResult.createFrom({ status: "future-status" }),
    );

    await expect(scanLocalFolder()).rejects.toThrow(/Unknown local-library scan status/);
  });

  it("maps stable cancelled/unavailable bridge errors and preserves real failures", async () => {
    (window as unknown as { go: object }).go = {};
    vi.mocked(Library.PickAndScan)
      .mockRejectedValueOnce(
        new Error('PLANET_ERROR:{"code":"cancelled","operation":"localLibrary.pickAndScan"}'),
      )
      .mockRejectedValueOnce(
        new Error('PLANET_ERROR:{"code":"unavailable","operation":"localLibrary.pickAndScan"}'),
      )
      .mockRejectedValueOnce(
        new Error('PLANET_ERROR:{"code":"failed","operation":"localLibrary.pickAndScan"}'),
      );

    await expect(scanLocalFolder()).resolves.toEqual({ status: "cancelled" });
    await expect(scanLocalFolder()).resolves.toEqual({ status: "unavailable" });
    await expect(scanLocalFolder()).rejects.toMatchObject({
      code: "failed",
      operation: "localLibrary.pickAndScan",
    });
  });
});
