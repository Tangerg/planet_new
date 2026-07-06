import * as Library from "@wailsjs/go/backend/Library";
import type { MediaAnalysisSourceResolver } from "@core/plugin";
import { wailsGoBridgeReady } from "./wails";

/** Desktop audio-analysis media-source gateway.
 *
 * Audible playback intentionally keeps the provider URL in the playback plugin.
 * Analysis uses the Go loopback /stream proxy when the desktop bridge exists,
 * because Web Audio needs a CORS-clean media source to sample.
 */
export const resolveDesktopMediaAnalysisSource: MediaAnalysisSourceResolver =
  loopbackAnalysisSource;

async function loopbackAnalysisSource(playUrl: string): Promise<string> {
  if (!wailsGoBridgeReady()) return playUrl;
  try {
    return (await Library.StreamURL(playUrl)) || playUrl;
  } catch {
    return playUrl;
  }
}
