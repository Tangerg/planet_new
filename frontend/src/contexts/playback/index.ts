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
export { PlayState } from "@domain/model/play-state";
export { RepeatMode, nextRepeatMode } from "@domain/model/repeat";
export { Volume } from "@domain/model/volume";
export { activeLyricIndex } from "@domain/model/lyric";
export type { Lyric } from "@domain/model/lyric";
export type { FormattedDuration, Progress } from "@domain/model/duration";
export { AudioPlaybackAdapter, playbackPlugin, TRANSPORT } from "@core/plugin/playback";
export { PlayQueueRuntime, playQueuePlugin, PLAY_QUEUE } from "@core/plugin/playqueue";
export { ProgressRuntime, progressPlugin, PROGRESS } from "@core/plugin/progress";
export { VolumeRuntime, volumePlugin, VOLUME_CONTROL } from "@core/plugin/volume";
/** The playback facts the kernel broadcasts; the UI store bridge pins them. */
export {
  CURRENT_TRACK_CHANGED,
  DURATION_CHANGED,
  LYRICS_CHANGED,
  PLAY_STATE_CHANGED,
  POSITION_CHANGED,
  QUEUE_CHANGED,
  REPEAT_CHANGED,
  SHUFFLE_CHANGED,
  VOLUME_CHANGED,
} from "@core/kernel/events";
