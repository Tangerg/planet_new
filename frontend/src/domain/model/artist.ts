import { type Image, pickImageUrl } from "./image";
import type { Track } from "./track";
import type { Album } from "./album";

/**
 * Artist, aligned with the Spotify Artist object (camelCase).
 * `followers` is flattened to a number (Spotify nests it as `followers.total`).
 */
export type Artist = {
  id: string;
  name: string;
  images: Image[];
  genres?: string[];
  /** Followers / monthly-listener count. */
  followers?: number;
  /** Alternate names; some CJK providers expose these. */
  alias?: string[];
  description?: string;
  /** Wide hero banner; provider-specific, not part of Spotify. */
  banner?: string;
  /** Top tracks, filled in by `artistDetail`. */
  topTracks?: Partial<Track>[];
  /** The artist's albums, filled in by `artistDetail`. */
  albums?: Partial<Album>[];
  /** Related artists, filled in by `artistDetail`. */
  similar?: Partial<Artist>[];
};

/** Artist behavior; see `Track` for the companion-object rationale. */
export const Artist = {
  coverUrl(a: Partial<Artist>, prefer: "large" | "small" = "large"): string {
    return pickImageUrl(a.images, prefer);
  },
};
