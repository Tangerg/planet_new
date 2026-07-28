import type { ProviderId } from "@contexts/contracts";

type DetailQueryKind = "album" | "chart" | "playlist";

export const queryKeys = {
  accountRoot: () => ["account"] as const,
  account: (providerId: ProviderId) => ["account", providerId] as const,

  likedIds: (providerId: ProviderId) => ["likedIds", providerId] as const,

  personalized: (providerId: ProviderId) => ["personalized", providerId] as const,
  comments: (providerId: ProviderId, trackId: string | undefined) =>
    ["comments", providerId, trackId] as const,

  userPlaylists: (providerId: ProviderId) => ["userPlaylists", providerId] as const,
  playRecord: (providerId: ProviderId, period: "week" | "all") =>
    ["playRecord", providerId, period] as const,
  dailyRecommendations: (providerId: ProviderId) => ["dailyRecommendations", providerId] as const,

  toplists: (providerId: ProviderId) => ["toplists", providerId] as const,
  detail: (providerId: ProviderId, kind: DetailQueryKind, id: string) =>
    ["detail", kind, providerId, id] as const,
  artist: (providerId: ProviderId, id: string) => ["artist", providerId, id] as const,

  musicVideo: (providerId: ProviderId, id: string) => ["musicVideo", providerId, id] as const,
  musicVideoDiscovery: (providerId: ProviderId, artistIds: readonly string[]) =>
    ["musicVideos", "artistDiscovery", providerId, [...artistIds]] as const,
  artistMusicVideos: (providerId: ProviderId, artistId: string | undefined) =>
    ["artistMusicVideos", providerId, artistId] as const,
  musicVideoComments: (providerId: ProviderId, musicVideoId: string | undefined) =>
    ["musicVideoComments", providerId, musicVideoId] as const,
};
