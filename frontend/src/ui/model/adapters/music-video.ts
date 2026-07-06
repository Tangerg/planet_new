import { MusicVideo } from "@domain/model/music-video";
import type { MusicVideo as DomainMusicVideo } from "@domain/model/music-video";

import { seedOf, type VibeMusicVideo } from "@/model/vibe";
import { toArtistRefs } from "@/model/adapters/helpers";

export function toVibeMusicVideo(mv: Partial<DomainMusicVideo>): VibeMusicVideo {
  const credited = MusicVideo.artistCredits(mv);
  return {
    id: String(mv.id ?? ""),
    title: mv.name ?? "",
    name: mv.name ?? "",
    artist: MusicVideo.artistNames(mv),
    artistId: MusicVideo.primaryArtist(mv)?.id,
    artists: toArtistRefs(credited),
    image: MusicVideo.coverUrl(mv),
    images: mv.images,
    coverSeed: seedOf(mv.id),
    duration: MusicVideo.durationFormatted(mv),
    durSec: MusicVideo.durationSeconds(mv),
    description: mv.description,
    publishDate: mv.publishDate,
    playCount: mv.playCount,
    commentCount: mv.commentCount,
    likedCount: mv.likedCount,
    shareCount: mv.shareCount,
    playUrl: mv.playUrl,
    playbackResolved: mv.playbackResolved,
    requiresSubscription: mv.requiresSubscription,
    available: mv.available,
    quality: mv.quality,
  };
}

export const toVibeMusicVideos = (videos?: readonly Partial<DomainMusicVideo>[]) =>
  (videos ?? []).map((video) => toVibeMusicVideo(video));
