import type { Artist } from "./artist";
import { type Image, pickImageUrl } from "./image";
import type { Track } from "./track";

/**
 * Album, aligned with the Spotify Album object (camelCase).
 * `releaseDate` is an ISO string (e.g. "2009-11-02").
 */
export type Album = {
  id: string;
  name: string;
  images: Image[];
  artists: Partial<Artist>[];
  releaseDate?: string;
  totalTracks?: number;
  albumType?: "album" | "single" | "compilation";
  /** Alternate titles; some CJK providers expose these, not part of Spotify. */
  alias?: string[];
  /** Album blurb / liner notes, when the provider exposes one. */
  description?: string;
  tracks?: Partial<Track>[];
};

/** Album behavior; see `Track` for the companion-object rationale. */
export const Album = {
  primaryArtist(a: Partial<Album>): Partial<Artist> | undefined {
    return a.artists?.[0];
  },

  artistNames(a: Partial<Album>): string {
    return (a.artists ?? [])
      .map((x) => x?.name)
      .filter(Boolean)
      .join(", ");
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
