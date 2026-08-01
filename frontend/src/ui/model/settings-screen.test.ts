import { describe, expect, it } from "vitest";
import { ProviderId } from "@domain";

import {
  initialSettingsSource,
  scanStateFromFolderResult,
  scanStatusDescriptor,
  shouldActivateScannedSource,
  sourceOptions,
  tokenOptions,
} from "./settings-screen";

describe("settings screen model", () => {
  it("builds token segment options from literal setting values", () => {
    expect(tokenOptions("STD", "HQ")).toEqual([
      { value: "STD", label: "STD" },
      { value: "HQ", label: "HQ" },
    ]);
  });

  it("names known sources by message and degrades unknown ones to their id", () => {
    expect(
      sourceOptions([ProviderId.of("netease"), ProviderId.of("local"), ProviderId.of("future")]),
    ).toEqual([
      { value: "netease", label: { key: "source.netease" } },
      { value: "local", label: { key: "source.local" } },
      { value: "future", label: { text: "future" } },
    ]);
  });

  it("chooses the active source first, then falls back to the first mounted provider", () => {
    expect(initialSettingsSource(ProviderId.of("qqmusic"), [ProviderId.of("netease")])).toBe(
      "qqmusic",
    );
    expect(initialSettingsSource(undefined, [ProviderId.of("netease")])).toBe("netease");
    expect(initialSettingsSource(null, [ProviderId.of("netease")])).toBe("netease");
    expect(initialSettingsSource(undefined, [])).toBe("");
  });

  it("describes scan states as i18n keys plus interpolation data", () => {
    expect(scanStatusDescriptor({ phase: "idle" })).toEqual({ key: "settings.addFolderSub" });
    expect(scanStatusDescriptor({ phase: "scanning" })).toEqual({ key: "settings.scanning" });
    expect(scanStatusDescriptor({ phase: "error" })).toEqual({ key: "settings.scanError" });
    expect(scanStatusDescriptor({ phase: "done", added: 3, total: 24 })).toEqual({
      key: "settings.scanDone",
      values: { added: 3, total: 24 },
    });
    expect(scanStatusDescriptor({ phase: "partial", added: 2, total: 20 })).toEqual({
      key: "settings.scanPartial",
      values: { added: 2, total: 20 },
    });
  });

  it("turns native folder scan results into settings state", () => {
    expect(scanStateFromFolderResult({ status: "cancelled" })).toEqual({ phase: "idle" });
    expect(scanStateFromFolderResult({ status: "unavailable" })).toEqual({ phase: "error" });
    expect(
      scanStateFromFolderResult({
        status: "complete",
        folder: "/music",
        scanned: 12,
        added: 2,
        total: 12,
        durationMs: 10,
      }),
    ).toEqual({
      phase: "done",
      added: 2,
      total: 12,
    });
    expect(
      scanStateFromFolderResult({
        status: "partial",
        folder: "/music",
        scanned: 1,
        added: 1,
        total: 12,
        durationMs: 10,
      }),
    ).toEqual({
      phase: "partial",
      added: 1,
      total: 12,
    });
  });

  it("activates the local source only after a completed scan", () => {
    expect(shouldActivateScannedSource({ phase: "done", added: 1, total: 1 })).toBe(true);
    expect(shouldActivateScannedSource({ phase: "partial", added: 1, total: 1 })).toBe(true);
    expect(shouldActivateScannedSource({ phase: "partial", added: 0, total: 0 })).toBe(false);
    expect(shouldActivateScannedSource({ phase: "idle" })).toBe(false);
    expect(shouldActivateScannedSource({ phase: "error" })).toBe(false);
  });
});
