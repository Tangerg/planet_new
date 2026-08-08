import { beforeEach, describe, expect, it, vi } from "vitest";

import { Library, ScanStatus } from "@bindings/github.com/Tangerg/planet_new/backend";
import type { ScanResult } from "@bindings/github.com/Tangerg/planet_new/backend";
import { scanLocalFolder } from "./localLibrary";

vi.mock("@bindings/github.com/Tangerg/planet_new/backend", async (importOriginal) => ({
  // Keep the generated enums; only the bound call is replaced.
  ...(await importOriginal<object>()),
  Library: { PickAndScan: vi.fn<typeof Library.PickAndScan>() },
}));

function scan(over: Partial<ScanResult> = {}): ScanResult {
  return {
    folder: "/music",
    scanned: 0,
    added: 0,
    total: 0,
    status: ScanStatus.ScanComplete,
    durationMs: 0,
    ...over,
  };
}

/** A rejection shaped the way Wails delivers a classified Go error. */
function bridgeRejection(code: string, operation: string): Error {
  return new Error(`local library ${operation} failed (${code})`, { cause: { code, operation } });
}

/** Stand in for the Wails webview: the adapter gates every call on it. */
function enterDesktopShell(): void {
  (window as unknown as { _wails: object })._wails = { environment: { OS: "darwin" } };
}

beforeEach(() => {
  vi.resetAllMocks();
  delete (window as unknown as { _wails?: object })._wails;
});

describe("Local Library Wails adapter", () => {
  it("reports an unavailable bridge explicitly", async () => {
    await expect(scanLocalFolder()).resolves.toEqual({ status: "unavailable" });
    expect(Library.PickAndScan).not.toHaveBeenCalled();
  });

  it("preserves cancelled, partial and complete scan outcomes", async () => {
    enterDesktopShell();
    vi.mocked(Library.PickAndScan)
      .mockResolvedValueOnce(scan({ status: ScanStatus.ScanCancelled, folder: "" }))
      .mockResolvedValueOnce(
        scan({ status: ScanStatus.ScanPartial, scanned: 2, added: 1, total: 4, durationMs: 10 }),
      )
      .mockResolvedValueOnce(
        scan({ status: ScanStatus.ScanComplete, scanned: 4, added: 2, total: 4, durationMs: 20 }),
      );

    await expect(scanLocalFolder()).resolves.toEqual({ status: "cancelled" });
    await expect(scanLocalFolder()).resolves.toMatchObject({ status: "partial", total: 4 });
    await expect(scanLocalFolder()).resolves.toMatchObject({ status: "complete", total: 4 });
  });

  it("rejects an unknown generated status instead of guessing", async () => {
    enterDesktopShell();
    vi.mocked(Library.PickAndScan).mockResolvedValue(
      scan({ status: "future-status" as ScanStatus }),
    );

    await expect(scanLocalFolder()).rejects.toThrow(/Unknown local-library scan status/);
  });

  it("maps stable cancelled/unavailable bridge errors and preserves real failures", async () => {
    enterDesktopShell();
    vi.mocked(Library.PickAndScan)
      .mockRejectedValueOnce(bridgeRejection("cancelled", "localLibrary.pickAndScan"))
      .mockRejectedValueOnce(bridgeRejection("unavailable", "localLibrary.pickAndScan"))
      .mockRejectedValueOnce(bridgeRejection("failed", "localLibrary.pickAndScan"));

    await expect(scanLocalFolder()).resolves.toEqual({ status: "cancelled" });
    await expect(scanLocalFolder()).resolves.toEqual({ status: "unavailable" });
    await expect(scanLocalFolder()).rejects.toMatchObject({
      code: "failed",
      operation: "localLibrary.pickAndScan",
    });
  });
});
