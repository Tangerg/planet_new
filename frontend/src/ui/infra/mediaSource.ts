import * as Library from "@wailsjs/go/backend/Library";
import { wailsGoBridgeReady } from "./wails";

/** Map a play URL to a loopback, CORS-clean URL for the shared <audio>.
 *
 * In the desktop shell the Go loopback server returns our own /media unchanged
 * and wraps remote provider URLs in a CORS byte-proxy, so the audible element is
 * same-origin and Web Audio can sample it. In plain Vite/browser tests there is
 * no Wails bridge, so playback falls back to the original URL (analysis then
 * degrades to idle if the source is cross-origin).
 */
export async function loopbackMediaSource(playUrl: string): Promise<string> {
  if (!wailsGoBridgeReady()) return playUrl;
  try {
    return (await Library.StreamURL(playUrl)) || playUrl;
  } catch {
    return playUrl;
  }
}
