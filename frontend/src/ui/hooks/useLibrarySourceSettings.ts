import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ProviderId } from "@contexts/contracts";

import type { LocalizedText } from "@/i18n/text";
import { useEngine } from "@/hooks/useEngine";
import { scanLocalFolder, LOCAL_PROVIDER_ID } from "@/infra/localLibrary";
import {
  initialSettingsSource,
  scanStateFromFolderResult,
  scanStatusDescriptor,
  shouldActivateScannedSource,
  sourceOptions,
  type SettingsScanState,
  type SourceOption,
} from "@/model/settings-screen";
import { warnWriteFailure } from "@shared/debug";

export type LibrarySourceSettingsModel = {
  addFolder: () => Promise<void>;
  options: SourceOption[];
  scan: SettingsScanState;
  status: LocalizedText;
  source: string;
  sources: readonly ProviderId[];
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
  const sources = engine.sources.ids;
  const [source, setSource] = useState(initialSettingsSource(engine.sources.activeId, sources));
  const [scan, setScan] = useState<SettingsScanState>({ phase: "idle" });

  const switchSource = useCallback(
    (value: string) => {
      const providerId = ProviderId.of(value);
      if (!engine.sources.select(providerId)) return;
      setSource(providerId);
      void queryClient.invalidateQueries();
    },
    [engine.sources, queryClient],
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
    options: useMemo(() => sourceOptions(sources), [sources]),
    scan,
    status: scanStatusDescriptor(scan),
    source,
    sources,
    switchSource,
  };
}
