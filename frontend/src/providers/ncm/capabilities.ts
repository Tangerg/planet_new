import type { ProviderCapability } from "@domain";

export const NCM_CAPABILITIES: ReadonlySet<ProviderCapability> = new Set<ProviderCapability>([
  "playlistDetail",
  "albumDetail",
  "artistDetail",
  "trackDetail",
  "musicVideoDetail",
  "artistMusicVideos",
  "musicVideoComments",
  "lyric",
  "personalized",
  "search",
  "toplist",
  "comments",
  "auth",
  "userLibrary",
  "fullPlayback",
]);
