import { SEARCH_SUGGESTIONS } from "./defaults";
import type { SearchResults, VibeArtist } from "./vibe";

export type SearchStatus = "idle" | "loading" | "empty" | "ready";

export type SearchProvider = (query: string) => Promise<SearchResults>;

export type SearchRequestPlan = {
  term: string;
  shouldRequest: boolean;
};

export const SEARCH_SONG_PREVIEW_LIMIT = 6;

export type SearchScreenModel = SearchResults & {
  chips: readonly string[];
  /** Lower-cased term, for matching a suggestion chip against what was typed.
   *  The screen already holds the raw query, so the model does not echo it. */
  normalizedTerm: string;
  status: SearchStatus;
  topArtist: VibeArtist | null;
  topTracks: SearchResults["tracks"];
};

export const EMPTY_SEARCH_RESULTS: SearchResults = {
  tracks: [],
  playlists: [],
  artists: [],
  albums: [],
};

export function normalizeSearchTerm(query: string): string {
  return query.trim();
}

export function searchRequestPlan(query: string): SearchRequestPlan {
  const term = normalizeSearchTerm(query);
  return {
    term,
    shouldRequest: term.length > 0,
  };
}

export function hasSearchResults(results: SearchResults): boolean {
  return (
    results.tracks.length > 0 ||
    results.playlists.length > 0 ||
    results.artists.length > 0 ||
    results.albums.length > 0
  );
}

export function searchStatus(
  query: string,
  results: SearchResults,
  loading: boolean,
): SearchStatus {
  if (!normalizeSearchTerm(query)) return "idle";
  if (loading) return "loading";
  return hasSearchResults(results) ? "ready" : "empty";
}

export function searchScreenModel(
  query: string,
  results: SearchResults = EMPTY_SEARCH_RESULTS,
  loading = false,
): SearchScreenModel {
  return {
    ...results,
    chips: SEARCH_SUGGESTIONS,
    normalizedTerm: normalizeSearchTerm(query).toLowerCase(),
    status: searchStatus(query, results, loading),
    topArtist: results.artists[0] ?? null,
    topTracks: results.tracks.slice(0, SEARCH_SONG_PREVIEW_LIMIT),
  };
}
