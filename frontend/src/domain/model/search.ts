import type { Album } from "./album";
import type { Artist } from "./artist";
import type { Playlist } from "./playlist";
import type { Track } from "./track";

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

export const SearchResult = {
  /** No matches across every dimension — the shape providers return for a blank
   *  query or an unsupported search, so the one empty literal lives here. */
  empty(): SearchResult {
    return { tracks: [], artists: [], albums: [], playlists: [] };
  },
};
