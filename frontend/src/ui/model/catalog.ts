import type { Chart } from "@domain/model/chart";
import type { Personalized } from "@domain/model/personalized";

import {
  seedOf,
  toVibeAlbum,
  toVibeArtist,
  toVibePlaylist,
  toVibeTracks,
  type ScreenData,
  type VibeCollection,
} from "@/model/adapt";

export function catalogScreenData(personalized?: Personalized): ScreenData {
  return {
    playlists: (personalized?.playlists ?? []).map(toVibePlaylist),
    albums: (personalized?.albums ?? []).map(toVibeAlbum),
    artists: (personalized?.artists ?? []).map(toVibeArtist),
    allTracks: toVibeTracks(personalized?.tracks),
  };
}

export function toVibeChart(chart: Chart): VibeCollection {
  return {
    id: chart.id,
    title: chart.title,
    name: chart.title,
    kind: "Chart",
    image: chart.image,
    coverSeed: seedOf(chart.id),
    sub: chart.period,
    updatedAt: chart.period ?? "today",
    tracks: [],
  };
}

export function toVibeCharts(charts?: readonly Chart[]): VibeCollection[] {
  return (charts ?? []).map(toVibeChart);
}
