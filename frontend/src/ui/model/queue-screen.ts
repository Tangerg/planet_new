import type { VibeTrack } from "./vibe";

export type QueueHeroModel = {
  artist: string;
  coverSeed: number;
  gradient?: string[];
  image?: string;
  images?: VibeTrack["images"];
  title: string;
};

export type QueueScreenModel = {
  current?: VibeTrack;
  hero: QueueHeroModel;
  isEmpty: boolean;
  queue: readonly VibeTrack[];
};

export function queueHeroModel(current: VibeTrack | undefined): QueueHeroModel {
  return {
    artist: current?.artist ?? "",
    coverSeed: current?.coverSeed ?? 0,
    gradient: current?.gradient,
    image: current?.image,
    images: current?.images,
    title: current?.title ?? "",
  };
}

export function queueItemKey(track: VibeTrack, index: number): string {
  return `${track.id}${index}`;
}

export function queueScreenModel(
  current: VibeTrack | undefined,
  queue: readonly VibeTrack[],
): QueueScreenModel {
  return {
    current,
    hero: queueHeroModel(current),
    isEmpty: queue.length === 0,
    queue,
  };
}
