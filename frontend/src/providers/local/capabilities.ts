import type { ProviderCapability } from "@domain";

/**
 * The on-device library plays full local files and can browse albums/artists +
 * search, but has no network-only concepts (login, user library, charts,
 * comments, music videos, or fetched lyrics). Tracks arrive with their loopback
 * `playUrl` already resolved, so `fullPlayback` marks them ready without a
 * resolution round-trip.
 */
export const LOCAL_CAPABILITIES: ReadonlySet<ProviderCapability> = new Set<ProviderCapability>([
  "playlistDetail",
  "albumDetail",
  "artistDetail",
  "trackDetail",
  "personalized",
  "search",
  "fullPlayback",
]);
