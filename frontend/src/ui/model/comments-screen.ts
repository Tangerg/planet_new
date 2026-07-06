import type { VibeTrack } from "./vibe";

export type CommentsTrackModel = {
  artist: string;
  coverSeed: number;
  gradient?: string[];
  image?: string;
  images?: VibeTrack["images"];
  qualityLabel: string;
  title: string;
};

export function commentsTrackModel(track: VibeTrack | undefined): CommentsTrackModel {
  return {
    artist: track?.artist ?? "",
    coverSeed: track?.coverSeed ?? 0,
    gradient: track?.gradient,
    image: track?.image,
    images: track?.images,
    qualityLabel: track?.quality || "SQ",
    title: track?.title ?? "",
  };
}
