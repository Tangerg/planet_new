import type { MessageKey } from "@/i18n/text";

import type { ScreenData, VibeCollection, VibeTrack } from "./vibe";

export type ForYouFilter = Readonly<{ value: string; labelKey: MessageKey }>;

export const FOR_YOU_FILTERS: readonly ForYouFilter[] = [
  { value: "all", labelKey: "common.all" },
  { value: "music", labelKey: "common.music" },
  { value: "mixes", labelKey: "common.mixes" },
  { value: "charts", labelKey: "common.charts" },
];

export const FOR_YOU_DEFAULT_FILTER = FOR_YOU_FILTERS[0].value;

export type ForYouCollectionRoute = "album" | "playlist";

/** The synthetic Daily Mix is app-authored, so its text is translated by the
 *  caller and handed in — a collection flows on into detail screens and morph
 *  targets, which read plain display strings. */
export type DailyMixText = Readonly<{ name: string; owner: string; description: string }>;

export type ForYouScreenModel = {
  albums: VibeCollection[];
  artists: ScreenData["artists"];
  dailyMix?: VibeCollection;
  featured?: VibeCollection;
  filters: readonly ForYouFilter[];
  greetingKey: MessageKey;
  playlists: VibeCollection[];
  tiles: VibeCollection[];
};

export function timeOfDayGreetingKey(date: Date): MessageKey {
  const hour = date.getHours();
  if (hour < 5) return "forYou.lateNight";
  if (hour < 12) return "forYou.morning";
  if (hour < 18) return "forYou.afternoon";
  return "forYou.evening";
}

export function dailyMixCollection(
  daily: readonly VibeTrack[],
  text: DailyMixText,
): VibeCollection | undefined {
  const [first] = daily;
  if (!first) return undefined;
  return {
    id: "daily-mix",
    name: text.name,
    kind: "playlist",
    owner: text.owner,
    coverSeed: first.coverSeed,
    gradient: first.gradient,
    image: first.image,
    images: first.images,
    description: text.description,
    tracks: daily.slice(),
    fetchDetail: false,
  };
}

export function forYouTiles(data: Pick<ScreenData, "playlists" | "albums">): VibeCollection[] {
  return [...data.playlists, ...data.albums].slice(0, 8);
}

export function forYouCollectionRoute(collection: VibeCollection): ForYouCollectionRoute {
  return collection.artist && collection.kind === "album" ? "album" : "playlist";
}

export function forYouScreenModel(
  data: ScreenData,
  daily: readonly VibeTrack[],
  dailyMixText: DailyMixText,
  now: Date,
): ForYouScreenModel {
  const dailyMix = dailyMixCollection(daily, dailyMixText);
  return {
    albums: data.albums,
    artists: data.artists,
    dailyMix,
    featured: dailyMix ?? data.playlists[1] ?? data.playlists[0],
    filters: FOR_YOU_FILTERS,
    greetingKey: timeOfDayGreetingKey(now),
    playlists: data.playlists,
    tiles: forYouTiles(data),
  };
}
