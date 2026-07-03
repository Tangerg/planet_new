import type { ProviderCapability } from "@domain";

/**
 * The on-device library plays full local files, can browse albums/artists +
 * search, and reads sidecar `.lrc` lyrics off disk — but has no network-only
 * concepts (login, user library, charts, comments, music videos). Tracks arrive
 * with their loopback `playUrl` already resolved, so `fullPlayback` marks them
 * ready without a resolution round-trip.
 */
export const LOCAL_CAPABILITIES: ReadonlySet<ProviderCapability> = new Set<ProviderCapability>([
  "playlistDetail",
  "albumDetail",
  "artistDetail",
  "trackDetail",
  "personalized",
  "search",
  "lyric",
  "fullPlayback",
]);
