/** Raw Spotify Web API shapes (snake_case, as returned by the API). */

export type SpotifyImage = {
  url: string;
  height: number | null;
  width: number | null;
};

export type SpotifySimplifiedArtist = { id: string; name: string };

export type SpotifySimplifiedAlbum = {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date?: string;
  artists?: SpotifySimplifiedArtist[];
  total_tracks?: number;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  preview_url: string | null;
  explicit?: boolean;
  track_number?: number;
  artists: SpotifySimplifiedArtist[];
  album?: SpotifySimplifiedAlbum;
};

export type SpotifyPaging<T> = {
  items: T[];
  total?: number;
  limit?: number;
  offset?: number;
};
