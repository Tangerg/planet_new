export type SettingsOption = {
  value: string;
  label: string;
};

export type SettingsScanState =
  | { phase: "idle" }
  | { phase: "scanning" }
  | { phase: "done"; added: number; total: number }
  | { phase: "error" };

export type SettingsScanStatusDescriptor =
  | { key: "settings.addFolderSub" }
  | { key: "settings.scanning" }
  | { key: "settings.scanDone"; values: { added: number; total: number } }
  | { key: "settings.scanError" };

export type SettingsFolderScanResult = { added: number; total: number } | null | undefined;

export const DEFAULT_SOURCE_LABELS: Record<string, string> = {
  NeteaseCloudMusic: "网易云",
  QQMusic: "QQ 音乐",
  Spotify: "Spotify",
};

export const AUDIO_QUALITY_OPTIONS = tokenOptions("STD", "HQ", "SQ");
export const NOW_PLAYING_OPEN_OPTIONS = tokenOptions("COVER", "LYRICS");

export function tokenOptions(...values: readonly string[]): SettingsOption[] {
  return values.map((value) => ({ value, label: value }));
}

export function sourceOptions(
  sources: readonly string[],
  labels: Readonly<Record<string, string>> = DEFAULT_SOURCE_LABELS,
): SettingsOption[] {
  return sources.map((source) => ({
    value: source,
    label: labels[source] ?? source,
  }));
}

export function initialSettingsSource(
  activeSourceName: string | undefined,
  sources: readonly string[],
): string {
  return activeSourceName ?? sources[0] ?? "";
}

export function scanStateFromFolderResult(result: SettingsFolderScanResult): SettingsScanState {
  return result ? { phase: "done", added: result.added, total: result.total } : { phase: "idle" };
}

export function shouldActivateScannedSource(scan: SettingsScanState): boolean {
  return scan.phase === "done";
}

export function scanStatusDescriptor(scan: SettingsScanState): SettingsScanStatusDescriptor {
  if (scan.phase === "scanning") return { key: "settings.scanning" };
  if (scan.phase === "done") {
    return {
      key: "settings.scanDone",
      values: { added: scan.added, total: scan.total },
    };
  }
  if (scan.phase === "error") return { key: "settings.scanError" };
  return { key: "settings.addFolderSub" };
}
