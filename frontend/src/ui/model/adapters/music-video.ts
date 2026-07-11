import { MusicVideo, type MusicVideoSnapshot } from "@contexts/catalog";

import { seedOf, type VibeMusicVideo } from "@/model/vibe";
import { toArtistRefs } from "@/model/adapters/helpers";

export function toVibeMusicVideo(mv: MusicVideoSnapshot): VibeMusicVideo {
  const credited = MusicVideo.artistCredits(mv);
  return {
    id: mv.id,
    title: mv.name,
    name: mv.name,
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

export const toVibeMusicVideos = (videos?: readonly MusicVideoSnapshot[]) =>
  (videos ?? []).map((video) => toVibeMusicVideo(video));
