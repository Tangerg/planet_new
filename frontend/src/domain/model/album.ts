import type { ArtistLink } from "./artist";
import { ArtistCredit } from "./artist-credit";
import { type Image, pickImageUrl } from "./image";
import type { TrackSnapshot } from "./track";
import type { ProviderId } from "./provider-id";

/**
 * Album, aligned with the Spotify Album object (camelCase).
 * `releaseDate` is an ISO string (e.g. "2009-11-02").
 */
export type Album = {
  /** Stable source identity; `id` below is local to this provider. */
  providerId: ProviderId;
  id: string;
  name: string;
  images: Image[];
  artists: ArtistLink[];
  releaseDate?: string;
  totalTracks?: number;
  albumType?: "album" | "single" | "compilation";
  /** Alternate titles; some CJK providers expose these, not part of Spotify. */
  alias?: string[];
  /** Album blurb / liner notes, when the provider exposes one. */
  description?: string;
  tracks?: TrackSnapshot[];
};

export type AlbumSummary = Omit<Album, "tracks">;

export type AlbumReference = Pick<Album, "providerId"> &
  Partial<Pick<Album, "id" | "name" | "images" | "artists">>;

export type AlbumSnapshot = AlbumSummary & Partial<Pick<Album, "tracks">>;

export type AlbumDetailSnapshot = AlbumSummary & {
  tracks: TrackSnapshot[];
};

/** Album behavior; see `Track` for the companion-object rationale. */
export const Album = {
  primaryArtist(a: Partial<Album>): ArtistLink | undefined {
    return a.artists?.find((artist) => artist?.name?.trim());
  },

  artistCredits(a: Partial<Album>): ArtistCredit[] {
    return ArtistCredit.from(a.artists);
  },

  artistNames(a: Partial<Album>): string {
    return ArtistCredit.names(Album.artistCredits(a));
  },

  /** Release year derived from `releaseDate`, or undefined when unknown. */
  year(a: Partial<Album>): number | undefined {
    return a.releaseDate ? new Date(a.releaseDate).getFullYear() : undefined;
  },

  trackCount(a: Partial<Album>): number {
    return a.totalTracks ?? a.tracks?.length ?? 0;
  },

  coverUrl(a: Partial<Album>, prefer: "large" | "small" = "large"): string {
    return pickImageUrl(a.images, prefer);
  },
};
