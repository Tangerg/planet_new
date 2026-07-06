import type { SearchResult } from "@domain/model/search";

import type { SearchResults } from "@/model/vibe";
import { toVibeArtist } from "./artist";
import { toVibeAlbum, toVibePlaylist } from "./collection";
import { toVibeTracks } from "./track";

export function toVibeSearchResults(result?: Partial<SearchResult>): SearchResults {
  return {
    tracks: toVibeTracks(result?.tracks),
    artists: (result?.artists ?? []).map(toVibeArtist),
    albums: (result?.albums ?? []).map(toVibeAlbum),
    playlists: (result?.playlists ?? []).map(toVibePlaylist),
  };
}
