type DetailQueryKind = "Album" | "Chart" | "Playlist";

export const queryKeys = {
  accountRoot: () => ["account"] as const,
  account: (providerName: string) => ["account", providerName] as const,

  likedIds: (providerName: string) => ["likedIds", providerName] as const,

  personalized: (providerName: string) => ["personalized", providerName] as const,
  comments: (providerName: string, trackId: string | undefined) =>
    ["comments", providerName, trackId] as const,

  userPlaylists: (providerName: string) => ["userPlaylists", providerName] as const,
  playRecord: (providerName: string, period: "week" | "all") =>
    ["playRecord", providerName, period] as const,
  dailyRecommendations: (providerName: string) => ["dailyRecommendations", providerName] as const,

  toplists: (providerName: string) => ["toplists", providerName] as const,
  detail: (providerName: string, kind: DetailQueryKind, id: string) =>
    ["detail", kind, providerName, id] as const,
  artist: (providerName: string, id: string) => ["artist", providerName, id] as const,

  musicVideo: (providerName: string, id: string) => ["musicVideo", providerName, id] as const,
  musicVideoDiscovery: (providerName: string, artistIds: readonly string[]) =>
    ["musicVideos", "artistDiscovery", providerName, [...artistIds]] as const,
  artistMusicVideos: (providerName: string, artistId: string | undefined) =>
    ["artistMusicVideos", providerName, artistId] as const,
  musicVideoComments: (providerName: string, musicVideoId: string | undefined) =>
    ["musicVideoComments", providerName, musicVideoId] as const,
};
