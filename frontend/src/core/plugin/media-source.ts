export type MaybePromise<T> = T | Promise<T>;

/** Resolves provider playback URLs into Web-Audio-analysis-safe media URLs.
 *
 * Audible playback deliberately uses the provider/native URL directly for
 * maximum compatibility. Analysis may need a loopback/CORS-clean URL so the
 * browser can sample it without rerouting the audible media element.
 */
export type MediaAnalysisSourceResolver = (playUrl: string) => MaybePromise<string>;

export const directMediaAnalysisSource: MediaAnalysisSourceResolver = (playUrl) => playUrl;

export async function resolveAnalysisSourceUrl(
  resolveAnalysisSource: MediaAnalysisSourceResolver,
  playUrl: string,
): Promise<string> {
  try {
    const resolved = await resolveAnalysisSource(playUrl);
    return resolved || playUrl;
  } catch {
    return playUrl;
  }
}
