import * as Library from "@wailsjs/go/backend/Library";
import { wailsGoBridgeReady } from "./wails";

/** Map an audible playback URL to the visualization-only source URL.
 *
 * In the desktop shell the Go loopback server proxies remote audio with CORS so
 * Web Audio can sample it. In plain Vite/browser tests there is no Wails bridge,
 * so the visualizer tries the original URL and degrades to idle if blocked.
 */
export async function audioAnalysisSource(playUrl: string): Promise<string> {
  if (!wailsGoBridgeReady()) return playUrl;
  try {
    return (await Library.StreamURL(playUrl)) || playUrl;
  } catch {
    return playUrl;
  }
}
