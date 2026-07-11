import type { MediaAnalysisSourceResolver } from "@core/plugin";
import { localLibraryStreamURL } from "./localLibrary";

/** Desktop audio-analysis media-source gateway.
 *
 * Audible playback intentionally keeps the provider URL in the playback plugin.
 * Analysis uses the Go loopback /stream proxy when the desktop bridge exists,
 * because Web Audio needs a CORS-clean media source to sample.
 */
export const resolveDesktopMediaAnalysisSource: MediaAnalysisSourceResolver = loopbackProxyUrl;

/** Wrap a remote URL in the Go loopback /stream byte-proxy so the frontend gets a
 *  CORS-clean source (Web Audio sampling and canvas pixel reads both need one).
 *  No-op (returns the input) without the desktop bridge or on failure. */
export async function loopbackProxyUrl(url: string): Promise<string> {
  try {
    return (await localLibraryStreamURL(url)) || url;
  } catch {
    return url;
  }
}
