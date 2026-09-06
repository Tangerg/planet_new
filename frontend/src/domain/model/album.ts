import type { ArtistLink } from "./artist";
import { ArtistCredit } from "./artist-credit";
import { type Image, pickImageUrl } from "./image";
import type { TrackSnapshot } from "./track";
import type { ProviderId } from "./provider-id";

/**
 * Album, aligned with the Spotify Album object (camelCase).
 * `releaseDate` is an ISO calendar date at whatever precision the source knows:
 * "2009", "2009-11" or "2009-11-02" (Spotify varies it by release_date_precision).
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
  primaryArtist(a: AlbumSnapshot): ArtistLink | undefined {
    return a.artists?.find((artist) => artist?.name?.trim());
  },

  artistCredits(a: AlbumSnapshot): ArtistCredit[] {
    return ArtistCredit.from(a.artists);
  },

  artistNames(a: AlbumSnapshot): string {
    return ArtistCredit.names(Album.artistCredits(a));
  },

  /**
   * Release year, read off the leading year of `releaseDate`. Read as text,
   * never through a Date: a calendar date names a day, not an instant, so
   * resolving one to a moment makes the year depend on where the reader is —
   * "2024-01-01" parses as UTC midnight and reports 2023 anywhere west of it.
   */
  year(a: AlbumSnapshot): number | undefined {
    const year = Number.parseInt(a.releaseDate ?? "", 10);
    return year > 0 ? year : undefined;
  },

  trackCount(a: AlbumSnapshot): number {
    return a.totalTracks ?? a.tracks?.length ?? 0;
  },

  coverUrl(a: AlbumSnapshot, prefer: "large" | "small" = "large"): string {
    return pickImageUrl(a.images, prefer);
  },
};
