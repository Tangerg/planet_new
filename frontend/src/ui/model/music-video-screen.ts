import { MusicVideo, type MusicVideoAvailabilityPolicy } from "@contexts/catalog";
import { compactCount } from "@shared/number";

import { effectiveMediaDuration, mediaProgress } from "./media-playback";
import type { ArtistRef, VibeComment, VibeMusicVideo } from "./vibe";

export type MusicVideosScreenModel = {
  featured?: VibeMusicVideo;
  rest: VibeMusicVideo[];
  related: VibeMusicVideo[];
  state: "loading" | "empty" | "ready";
};

export type MusicVideoDetailModel = {
  artist?: ArtistRef;
  availability: ReturnType<typeof MusicVideo.playbackAvailability>;
  canPlay: boolean;
  commentLabel?: string;
  rail: VibeMusicVideo[];
};

export type MusicVideoTheaterModel = {
  availability: ReturnType<typeof MusicVideo.playbackAvailability>;
  commentsPreview: VibeComment[];
  fallbackText: string;
  hasStream: boolean;
  progress: number;
  qualityLabel: string;
  totalSec: number;
};

export function musicVideosScreenModel(
  videos: readonly VibeMusicVideo[],
  isLoading: boolean,
): MusicVideosScreenModel {
  const [featured, ...rest] = videos;
  return {
    featured,
    rest,
    related: [...videos],
    state: isLoading ? "loading" : featured ? "ready" : "empty",
  };
}

export function relatedMusicVideoRail(
  related: readonly VibeMusicVideo[],
  currentVideoId: string,
  limit = 12,
): VibeMusicVideo[] {
  return related.filter((video) => video.id !== currentVideoId).slice(0, limit);
}

export function musicVideoCommentLabel(commentCount: number | undefined): string | undefined {
  if (!commentCount) return undefined;
  return (
    new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
      commentCount,
    ) + " comments"
  );
}

export function musicVideoDetailModel(
  video: VibeMusicVideo,
  related: readonly VibeMusicVideo[],
  playbackPolicy: MusicVideoAvailabilityPolicy,
): MusicVideoDetailModel {
  const availability = MusicVideo.playbackAvailability(video, playbackPolicy);
  return {
    artist: video.artists?.[0],
    availability,
    canPlay: availability.canStart,
    commentLabel: musicVideoCommentLabel(video.commentCount),
    rail: relatedMusicVideoRail(related, video.id),
  };
}

export function musicVideoFallbackText(
  availability: ReturnType<typeof MusicVideo.playbackAvailability>,
): string {
  return availability.status === "resolvable"
    ? "Resolving video stream..."
    : "Video URL unavailable";
}

export function musicVideoQualityLabel(video: Pick<VibeMusicVideo, "quality">): string {
  return video.quality ? `${video.quality}P` : "MV";
}

export function musicVideoMetaPieces(
  video: Pick<VibeMusicVideo, "duration" | "playCount" | "quality">,
): string[] {
  return [
    musicVideoQualityLabel(video),
    video.duration,
    video.playCount ? `${compactCount(video.playCount)} plays` : "",
  ].filter(Boolean);
}

export function musicVideoMetaLabel(
  video: Pick<VibeMusicVideo, "duration" | "playCount" | "quality">,
): string {
  return musicVideoMetaPieces(video).join(" · ");
}

export function musicVideoTheaterModel({
  comments,
  durationSec,
  playbackPolicy,
  positionSec,
  video,
}: {
  comments: readonly VibeComment[];
  durationSec: number;
  playbackPolicy: MusicVideoAvailabilityPolicy;
  positionSec: number;
  video: VibeMusicVideo;
}): MusicVideoTheaterModel {
  const availability = MusicVideo.playbackAvailability(video, playbackPolicy);
  const totalSec = effectiveMediaDuration(durationSec, video.durSec);
  return {
    availability,
    commentsPreview: comments.slice(0, 14),
    fallbackText: musicVideoFallbackText(availability),
    hasStream: availability.status === "ready",
    progress: mediaProgress(positionSec, totalSec),
    qualityLabel: musicVideoQualityLabel(video),
    totalSec,
  };
}
