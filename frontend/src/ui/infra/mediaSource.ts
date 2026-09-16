import type { MediaAnalysisSourceResolver } from "@core/plugin";
import { localLibraryStreamURL } from "./localLibrary";

export const resolveDesktopMediaAnalysisSource: MediaAnalysisSourceResolver = loopbackProxyUrl;

export async function loopbackProxyUrl(url: string): Promise<string> {
  try {
    return (await localLibraryStreamURL(url)) || url;
  } catch {
    return url;
  }
}
