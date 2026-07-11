import * as Library from "@wailsjs/go/backend/Library";
import {
  localLibraryCall,
  LocalLibraryScanStatus,
  toLocalLibraryError,
  type LocalLibraryScanOutcome,
  type LocalLibraryScanResult,
} from "@contexts/local-library";
import { ProviderId } from "@contexts/contracts";
import { wailsGoBridgeReady } from "./wails";

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
  if (!wailsGoBridgeReady()) return { status: LocalLibraryScanStatus.unavailable };
  let result;
  try {
    result = await localLibraryCall(Library.PickAndScan());
  } catch (error) {
    const projected = toLocalLibraryError(error);
    if (projected.code === "cancelled") return { status: LocalLibraryScanStatus.cancelled };
    if (projected.code === "unavailable") return { status: LocalLibraryScanStatus.unavailable };
    throw projected;
  }
  if (result.status === LocalLibraryScanStatus.cancelled) {
    return { status: LocalLibraryScanStatus.cancelled };
  }
  if (
    result.status !== LocalLibraryScanStatus.complete &&
    result.status !== LocalLibraryScanStatus.partial
  ) {
    throw new Error(`Unknown local-library scan status: ${result.status}`);
  }
  return {
    status: result.status,
    folder: result.folder,
    scanned: result.scanned,
    added: result.added,
    total: result.total,
    durationMs: result.durationMs,
  } satisfies LocalLibraryScanResult;
}

/** Resolve a CORS-clean loopback URL for analysis-only media reads. */
export async function localLibraryStreamURL(url: string): Promise<string | undefined> {
  if (!wailsGoBridgeReady()) return undefined;
  return (await Library.StreamURL(url)) || undefined;
}
