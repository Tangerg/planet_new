import { Library, ScanStatus } from "@bindings/github.com/Tangerg/planet_new/backend";
import {
  localLibraryCall,
  LocalLibraryScanStatus,
  toLocalLibraryError,
  type LocalLibraryScanOutcome,
  type LocalLibraryScanResult,
} from "@contexts/local-library";
import { ProviderId } from "@contexts/contracts";
import { isDesktopShell } from "@shared/desktop";

/**
 * Desktop-shell adapter for the on-device music library — the Settings screen's
 * folder-scan action. Sits alongside `wails.ts` (window controls): both are the
 * UI's thin, undefined-safe wrappers over the Wails Go bridge for shell-level
 * actions, kept out of the Engine facade (which owns kernel/provider data, not
 * OS actions like native dialogs).
 */

/** The Local provider's stable id. Mirrors `LocalMusic.ID`, duplicated as a
 *  literal because the UI layer must not import the providers layer. */
export const LOCAL_PROVIDER_ID = ProviderId.of("local");

/**
 * Open a native folder picker and index it into the on-device library. Resolves
 * to an explicit outcome, including cancellation and bridge unavailability.
 */
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
    // The generated wire enum and the context's status share their string values,
    // but they are separate contracts — translate rather than pass through.
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

/** Resolve a CORS-clean loopback URL for analysis-only media reads. */
export async function localLibraryStreamURL(url: string): Promise<string | undefined> {
  if (!isDesktopShell()) return undefined;
  return (await Library.StreamURL(url)) || undefined;
}
