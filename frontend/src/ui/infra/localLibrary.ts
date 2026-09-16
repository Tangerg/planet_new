import { Library, ScanStatus } from "@bindings/github.com/Tangerg/planet_new/backend";
import {
  localLibraryCall,
  LocalLibraryScanStatus,
  toLocalLibraryError,
  type LocalLibraryScanOutcome,
  type LocalLibraryScanResult,
} from "@contexts/local-library";
import { isDesktopShell } from "@shared/desktop";

export async function scanLocalFolder(): Promise<LocalLibraryScanOutcome> {
  if (!isDesktopShell()) return { status: LocalLibraryScanStatus.unavailable };
  let result;
  try {
    result = await localLibraryCall(Library.PickAndScan());
  } catch (error) {
    const projected = toLocalLibraryError(error);
    if (projected.code === "cancelled") return { status: LocalLibraryScanStatus.cancelled };
    if (projected.code === "unavailable") return { status: LocalLibraryScanStatus.unavailable };
    throw projected;
  }
  if (result.status === ScanStatus.ScanCancelled) {
    return { status: LocalLibraryScanStatus.cancelled };
  }
  if (result.status !== ScanStatus.ScanComplete && result.status !== ScanStatus.ScanPartial) {
    throw new Error(`Unknown local-library scan status: ${result.status}`);
  }
  return {
    status:
      result.status === ScanStatus.ScanComplete
        ? LocalLibraryScanStatus.complete
        : LocalLibraryScanStatus.partial,
    folder: result.folder,
    scanned: result.scanned,
    added: result.added,
    total: result.total,
    durationMs: result.durationMs,
  } satisfies LocalLibraryScanResult;
}

export async function localLibraryStreamURL(url: string): Promise<string | undefined> {
  if (!isDesktopShell()) return undefined;
  return (await Library.StreamURL(url)) || undefined;
}
