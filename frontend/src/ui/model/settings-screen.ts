import type { LocalLibraryScanOutcome } from "@contexts/local-library";
import type { ProviderId } from "@contexts/contracts";

export type SettingsOption = {
  value: string;
  label: string;
};

export type SettingsScanState =
  | { phase: "idle" }
  | { phase: "scanning" }
  | { phase: "done"; added: number; total: number }
  | { phase: "partial"; added: number; total: number }
  | { phase: "error" };

export type SettingsScanStatusDescriptor =
  | { key: "settings.addFolderSub" }
  | { key: "settings.scanning" }
  | { key: "settings.scanDone"; values: { added: number; total: number } }
  | { key: "settings.scanPartial"; values: { added: number; total: number } }
  | { key: "settings.scanError" };

export const DEFAULT_SOURCE_LABELS: Record<string, string> = {
  netease: "网易云",
  qqmusic: "QQ 音乐",
  spotify: "Spotify",
};

export const AUDIO_QUALITY_OPTIONS = tokenOptions("STD", "HQ", "SQ");
export const NOW_PLAYING_OPEN_OPTIONS = tokenOptions("COVER", "LYRICS");

export function tokenOptions(...values: readonly string[]): SettingsOption[] {
  return values.map((value) => ({ value, label: value }));
}

export function sourceOptions(
  sources: readonly ProviderId[],
  labels: Readonly<Record<string, string>> = DEFAULT_SOURCE_LABELS,
): SettingsOption[] {
  return sources.map((source) => ({
    value: source,
    label: labels[source] ?? source,
  }));
}

export function initialSettingsSource(
  activeProviderId: ProviderId | undefined,
  sources: readonly ProviderId[],
): string {
  return activeProviderId ?? sources[0] ?? "";
}

export function scanStateFromFolderResult(result: LocalLibraryScanOutcome): SettingsScanState {
  if (result.status === "cancelled") return { phase: "idle" };
  if (result.status === "unavailable") return { phase: "error" };
  return {
    phase: result.status === "complete" ? "done" : "partial",
    added: result.added,
    total: result.total,
  };
}

export function shouldActivateScannedSource(scan: SettingsScanState): boolean {
  return scan.phase === "done" || (scan.phase === "partial" && scan.total > 0);
}

export function scanStatusDescriptor(scan: SettingsScanState): SettingsScanStatusDescriptor {
  if (scan.phase === "scanning") return { key: "settings.scanning" };
  if (scan.phase === "done") {
    return {
      key: "settings.scanDone",
      values: { added: scan.added, total: scan.total },
    };
  }
  if (scan.phase === "partial") {
    return {
      key: "settings.scanPartial",
      values: { added: scan.added, total: scan.total },
    };
  }
  if (scan.phase === "error") return { key: "settings.scanError" };
  return { key: "settings.addFolderSub" };
}
