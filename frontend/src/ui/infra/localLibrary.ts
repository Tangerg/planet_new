import * as Library from "@wailsjs/go/backend/Library";
import type { backend } from "@wailsjs/go/models";

/**
 * Desktop-shell shim for the on-device music library — the Settings screen's
 * folder-scan action. Sits alongside `wails.ts` (window controls): both are the
 * UI's thin, undefined-safe wrappers over the Wails Go bridge for shell-level
 * actions, kept out of the Engine facade (which owns kernel/provider data, not
 * OS actions like native dialogs).
 */

/** The Local provider's registry name. Mirrors `LocalMusic.NAME`, duplicated as a
 *  literal because the UI layer must not import the providers layer. */
export const LOCAL_PROVIDER_NAME = "Local";

/** The Go bridge only exists inside the Wails webview. */
function bridgeReady(): boolean {
  return typeof window !== "undefined" && "go" in window;
}

/**
 * Open a native folder picker and index it into the on-device library. Resolves
 * to the scan result, or `undefined` when the picker was cancelled or the desktop
 * bridge is unavailable (a plain-browser dev session).
 */
export async function scanLocalFolder(): Promise<backend.ScanResult | undefined> {
  if (!bridgeReady()) return undefined;
  const result = await Library.PickAndScan();
  return result.folder ? result : undefined; // cancelled → zero result (empty folder)
}
