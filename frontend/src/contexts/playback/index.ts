/** Playback Context public API. */
export {
  PlaybackResolutionError,
  PlaybackService,
  type PlaybackResolutionOutcome,
  type PlaybackStartOutcome,
} from "@core/application/PlaybackService";
export type { AudioOutputPort, PlaybackResolver } from "@domain/ports/playback";
export { PlayQueue, type RandomSource } from "@domain/model/play-queue";
export { PlaybackIntent } from "@domain/model/playback-intent";
export type { PlaybackAvailabilityPolicy } from "@domain/model/playback-availability";
export { RepeatMode, nextRepeatMode } from "@domain/model/repeat";
export { Volume } from "@domain/model/volume";
export { activeLyricIndex } from "@domain/model/lyric";
export type { Lyric } from "@domain/model/lyric";
export type { FormattedDuration, Progress } from "@domain/model/duration";
export { AudioPlaybackAdapter, PlayState, TRANSPORT } from "@core/plugin/playback";
export { PlayQueueRuntime, PLAY_QUEUE } from "@core/plugin/playqueue";
export { ProgressRuntime, PROGRESS } from "@core/plugin/progress";
export { VolumeRuntime, VOLUME_CONTROL } from "@core/plugin/volume";
