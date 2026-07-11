import type { SearchResultSnapshot } from "@contexts/catalog";

import type { SearchResults } from "@/model/vibe";
import { toVibeArtist } from "./artist";
import { toVibeAlbum, toVibePlaylist } from "./collection";
import { toVibeTracks } from "./track";

export function toVibeSearchResults(result?: SearchResultSnapshot): SearchResults {
  return {
    tracks: toVibeTracks(result?.tracks),
    artists: (result?.artists ?? []).map(toVibeArtist),
    albums: (result?.albums ?? []).map(toVibeAlbum),
    playlists: (result?.playlists ?? []).map(toVibePlaylist),
  };
}
