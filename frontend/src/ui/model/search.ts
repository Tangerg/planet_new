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
  emptyMessage: string;
  normalizedTerm: string;
  status: SearchStatus;
  term: string;
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

function emptyMessage(query: string, status: SearchStatus): string {
  if (status === "idle") return "Search tracks, playlists, artists & albums…";
  if (status === "loading") return `Searching “${query}”…`;
  if (status === "empty") return `Nothing for “${query}”…`;
  return "";
}

export function searchScreenModel(
  query: string,
  results: SearchResults = EMPTY_SEARCH_RESULTS,
  loading = false,
): SearchScreenModel {
  const term = normalizeSearchTerm(query);
  const status = searchStatus(query, results, loading);
  return {
    ...results,
    chips: SEARCH_SUGGESTIONS,
    emptyMessage: emptyMessage(query, status),
    normalizedTerm: term.toLowerCase(),
    status,
    term,
    topArtist: results.artists[0] ?? null,
    topTracks: results.tracks.slice(0, SEARCH_SONG_PREVIEW_LIMIT),
  };
}
