import { Album } from "./album";
import { Artist } from "./artist";
import { Playlist } from "./playlist";
import { Track } from "./track";

/**
 * Unified search result. Each provider fills whichever dimensions it supports;
 * unsupported ones return empty arrays (not errors), so callers need no if/try.
 */
export type SearchResult = {
  tracks: Partial<Track>[];
  artists: Partial<Artist>[];
  albums: Partial<Album>[];
  playlists: Partial<Playlist>[];
};
