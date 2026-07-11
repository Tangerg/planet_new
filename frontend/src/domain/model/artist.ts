import { type Image, pickImageUrl } from "./image";
import type { TrackSnapshot } from "./track";
import type { AlbumSummary } from "./album";
import type { ProviderId } from "./provider-id";

/**
 * Artist, aligned with the Spotify Artist object (camelCase).
 * `followers` is flattened to a number (Spotify nests it as `followers.total`).
 */
export type Artist = {
  /** Stable source identity; `id` below is local to this provider. */
  providerId: ProviderId;
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
  topTracks?: TrackSnapshot[];
  /** The artist's albums, filled in by `artistDetail`. */
  albums?: AlbumSummary[];
  /** Related artists, filled in by `artistDetail`. */
  similar?: ArtistSummary[];
};

/** Minimal active-source lookup input. It is deliberately not an entity
 * identity: cross-source references use provider-qualified ArtistLink data. */
export type ArtistLookupReference = Pick<Artist, "id">;

/** Credit/link embedded in another catalog entity. Provider payloads may omit
 * id or artwork, but the owning source remains mandatory. */
export type ArtistLink = Pick<Artist, "providerId"> &
  Partial<Pick<Artist, "id" | "name" | "images">>;

/** Catalog list shape. Detail-only relationships are deliberately absent. */
export type ArtistSummary = Omit<Artist, "topTracks" | "albums" | "similar">;

export type ArtistSnapshot = ArtistSummary &
  Partial<Pick<Artist, "topTracks" | "albums" | "similar">>;

/** Successful artist-detail query snapshot with explicit collection completeness. */
export type ArtistDetailSnapshot = ArtistSummary & {
  topTracks: TrackSnapshot[];
  albums: AlbumSummary[];
  similar: ArtistSummary[];
};

/** Artist behavior; see `Track` for the companion-object rationale. */
export const Artist = {
  coverUrl(a: Partial<Artist>, prefer: "large" | "small" = "large"): string {
    return pickImageUrl(a.images, prefer);
  },

  /** Top tracks (filled by `artistDetail`), never undefined. */
  hotTracks(a: Partial<Artist>): TrackSnapshot[] {
    return a.topTracks ?? [];
  },

  /**
   * Provider lookup ids from a seed set, de-duplicated in encounter order.
   * Useful for fan-out reads such as "find videos for these artists".
   */
  uniqueIds(
    artists: readonly Partial<ArtistLookupReference>[],
    limit = Number.POSITIVE_INFINITY,
  ): string[] {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const artist of artists) {
      const id = artist.id?.trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
      if (ids.length >= limit) break;
    }
    return ids;
  },
};
