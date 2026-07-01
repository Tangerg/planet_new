import type { Artist } from "./artist";
import { ArtistCredit } from "./artist-credit";
import { type Image, pickImageUrl } from "./image";
import { formatDuration, Minute, Second } from "@shared/time";

/**
 * Music video, deliberately narrower than a generic "video" model.
 * Planet only treats official music videos as part of the core streaming
 * surface; short-video feeds, live rooms, Mlog, etc. stay out of scope.
 */
export type MusicVideo = {
  id: string;
  name: string;
  images: Image[];
  artists: Partial<Artist>[];
  durationMs?: number;
  description?: string;
  publishDate?: string;
  playCount?: number;
  commentCount?: number;
  likedCount?: number;
  shareCount?: number;
  /** Resolved playable MV URL, filled by providers that support it. */
  playUrl?: string;
  /** Chosen resolution, e.g. 1080. */
  quality?: number;
};

export const MusicVideo = {
  coverUrl(mv: Partial<MusicVideo>, prefer: "large" | "small" = "large"): string {
    return pickImageUrl(mv.images, prefer);
  },

  primaryArtist(mv: Partial<MusicVideo>): Partial<Artist> | undefined {
    return mv.artists?.find((artist) => artist?.name?.trim());
  },

  artistCredits(mv: Partial<MusicVideo>): ArtistCredit[] {
    return ArtistCredit.from(mv.artists);
  },

  artistNames(mv: Partial<MusicVideo>): string {
    return ArtistCredit.names(MusicVideo.artistCredits(mv));
  },

  durationSeconds(mv: Partial<MusicVideo>): number {
    return Math.floor((mv.durationMs ?? 0) / Second);
  },

  durationFormatted(mv: Partial<MusicVideo>): string {
    return formatDuration(mv.durationMs ?? 0, [Minute, Second]);
  },

  isPlayable(mv: Partial<MusicVideo>): boolean {
    return Boolean(mv.playUrl);
  },

  uniqueById(videos: readonly Partial<MusicVideo>[]): Partial<MusicVideo>[] {
    const seen = new Set<string>();
    const unique: Partial<MusicVideo>[] = [];
    for (const video of videos) {
      const id = String(video.id ?? "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      unique.push(video);
    }
    return unique;
  },
};
