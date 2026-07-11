import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ProviderId } from "@contexts/contracts";

import { useEngine } from "@/hooks/useEngine";
import { scanLocalFolder, LOCAL_PROVIDER_ID } from "@/infra/localLibrary";
import {
  DEFAULT_SOURCE_LABELS,
  initialSettingsSource,
  scanStateFromFolderResult,
  scanStatusDescriptor,
  shouldActivateScannedSource,
  sourceOptions,
  type SettingsOption,
  type SettingsScanState,
  type SettingsScanStatusDescriptor,
} from "@/model/settings-screen";
import { warnWriteFailure } from "@shared/debug";

const SOURCE_LABELS: Record<string, string> = {
  ...DEFAULT_SOURCE_LABELS,
  [LOCAL_PROVIDER_ID]: "本地",
};

export type LibrarySourceSettingsModel = {
  addFolder: () => Promise<void>;
  options: SettingsOption[];
  scan: SettingsScanState;
  status: SettingsScanStatusDescriptor;
  source: string;
  sources: ProviderId[];
  switchSource: (providerId: string) => void;
};

/**
 * Local-library preferences are UI application behavior: provider switching,
 * native folder picking, and cache invalidation. Keeping that orchestration here
 * lets Settings render a model instead of knowing how the engine refreshes.
 */
export function useLibrarySourceSettings(): LibrarySourceSettingsModel {
  const engine = useEngine();
  const queryClient = useQueryClient();
  const sources = engine.providers.providers.map((provider) => provider.providerId);
  const [source, setSource] = useState(
    initialSettingsSource(engine.providers.active?.providerId, sources),
  );
  const [scan, setScan] = useState<SettingsScanState>({ phase: "idle" });

  const switchSource = useCallback(
    (value: string) => {
      const providerId = ProviderId.of(value);
      if (!engine.providers.providers.some((provider) => provider.providerId === providerId))
        return;
      engine.providers.setActive(providerId);
      setSource(providerId);
      void queryClient.invalidateQueries();
    },
    [engine.providers, queryClient],
  );

  const addFolder = useCallback(async () => {
    setScan({ phase: "scanning" });
    try {
      const result = await scanLocalFolder();
      const nextScan = scanStateFromFolderResult(result);
      if (shouldActivateScannedSource(nextScan)) switchSource(LOCAL_PROVIDER_ID);
      setScan(nextScan);
    } catch (error) {
      warnWriteFailure("localLibrary.scan", error);
      setScan({ phase: "error" });
    }
  }, [switchSource]);

  return {
    addFolder,
    options: useMemo(() => sourceOptions(sources, SOURCE_LABELS), [sources]),
    scan,
    status: scanStatusDescriptor(scan),
    source,
    sources,
    switchSource,
  };
}
