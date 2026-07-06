import { describe, expect, it } from "vitest";

import {
  DEFAULT_SOURCE_LABELS,
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

  it("labels provider registry names while preserving unknown sources", () => {
    expect(
      sourceOptions(["NeteaseCloudMusic", "Local", "FutureProvider"], {
        ...DEFAULT_SOURCE_LABELS,
        Local: "本地",
      }),
    ).toEqual([
      { value: "NeteaseCloudMusic", label: "网易云" },
      { value: "Local", label: "本地" },
      { value: "FutureProvider", label: "FutureProvider" },
    ]);
  });

  it("chooses the active source first, then falls back to the first mounted provider", () => {
    expect(initialSettingsSource("QQMusic", ["NeteaseCloudMusic"])).toBe("QQMusic");
    expect(initialSettingsSource(undefined, ["NeteaseCloudMusic"])).toBe("NeteaseCloudMusic");
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
  });

  it("turns native folder scan results into settings state", () => {
    expect(scanStateFromFolderResult(undefined)).toEqual({ phase: "idle" });
    expect(scanStateFromFolderResult(null)).toEqual({ phase: "idle" });
    expect(scanStateFromFolderResult({ added: 2, total: 12 })).toEqual({
      phase: "done",
      added: 2,
      total: 12,
    });
  });

  it("activates the local source only after a completed scan", () => {
    expect(shouldActivateScannedSource({ phase: "done", added: 1, total: 1 })).toBe(true);
    expect(shouldActivateScannedSource({ phase: "idle" })).toBe(false);
    expect(shouldActivateScannedSource({ phase: "error" })).toBe(false);
  });
});
