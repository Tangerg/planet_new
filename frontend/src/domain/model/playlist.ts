import type { Track } from "./track";
import { type Image, pickImageUrl } from "./image";
import type { User } from "./user";

/**
 * Playlist, aligned with the Spotify Playlist object (camelCase).
 * `tracks` is a flat array — Spotify's paging wrapper is unwrapped at the mapper.
 */
export type Playlist = {
  id: string;
  name: string;
  description?: string;
  images: Image[];
  owner?: Partial<User>;
  totalTracks?: number;
  tracks: Partial<Track>[];
};

/** Playlist behavior; see `Track` for the companion-object rationale. */
export const Playlist = {
  empty(id = "", name = ""): Playlist {
    return { id, name, images: [], tracks: [], totalTracks: 0 };
  },

  ownerName(p: Partial<Playlist>): string | undefined {
    return p.owner?.displayName;
  },

  trackCount(p: Partial<Playlist>): number {
    return p.totalTracks ?? p.tracks?.length ?? 0;
  },

  coverUrl(p: Partial<Playlist>, prefer: "large" | "small" = "large"): string {
    return pickImageUrl(p.images, prefer);
  },
};
