import type { AlbumSummary } from "./album";
import type { ArtistSummary } from "./artist";
import type { PlaylistSummary } from "./playlist";
import type { TrackSnapshot } from "./track";

/**
 * Successful unified search snapshot. A supported dimension may contain no
 * matches; source-level unsupported and failure states are represented by the
 * application QueryResult boundary rather than by this data shape.
 */
export type SearchResult = {
  tracks: TrackSnapshot[];
  artists: ArtistSummary[];
  albums: AlbumSummary[];
  playlists: PlaylistSummary[];
};

export const SearchResult = {
  /** No matches across every dimension, including the blank-query result. */
  empty(): SearchResult {
    return { tracks: [], artists: [], albums: [], playlists: [] };
  },
};
