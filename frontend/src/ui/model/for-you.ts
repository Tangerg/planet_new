import type { ScreenData, VibeCollection, VibeTrack } from "./vibe";

export const FOR_YOU_FILTERS = ["All", "Music", "Mixes", "Charts"] as const;

export type ForYouCollectionRoute = "album" | "playlist";

export type ForYouScreenModel = {
  albums: VibeCollection[];
  artists: ScreenData["artists"];
  dailyMix?: VibeCollection;
  featured?: VibeCollection;
  filters: readonly string[];
  greeting: string;
  playlists: VibeCollection[];
  tiles: VibeCollection[];
};

export function timeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function dailyMixCollection(daily: readonly VibeTrack[]): VibeCollection | undefined {
  const [first] = daily;
  if (!first) return undefined;
  return {
    id: "daily-mix",
    name: "Daily Mix",
    kind: "Playlist",
    owner: "For You",
    coverSeed: first.coverSeed,
    gradient: first.gradient,
    image: first.image,
    images: first.images,
    description: "Songs picked for you today — refreshed every morning.",
    tracks: daily.slice(),
    fetchDetail: false,
  };
}

export function featuredForYouCollection(
  data: Pick<ScreenData, "playlists">,
  daily: readonly VibeTrack[],
): VibeCollection | undefined {
  return dailyMixCollection(daily) ?? data.playlists[1] ?? data.playlists[0];
}

export function forYouTiles(data: Pick<ScreenData, "playlists" | "albums">): VibeCollection[] {
  return [...data.playlists, ...data.albums].slice(0, 8);
}

export function forYouCollectionRoute(collection: VibeCollection): ForYouCollectionRoute {
  return collection.artist && collection.kind === "Album" ? "album" : "playlist";
}

export function forYouScreenModel(
  data: ScreenData,
  daily: readonly VibeTrack[],
  now = new Date(),
): ForYouScreenModel {
  const dailyMix = dailyMixCollection(daily);
  return {
    albums: data.albums,
    artists: data.artists,
    dailyMix,
    featured: dailyMix ?? data.playlists[1] ?? data.playlists[0],
    filters: FOR_YOU_FILTERS,
    greeting: timeOfDayGreeting(now),
    playlists: data.playlists,
    tiles: forYouTiles(data),
  };
}
