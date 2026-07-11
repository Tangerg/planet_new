/** Engagement module public API. */
export { EngagementService } from "@core/application/EngagementService";
export { Comment } from "@domain/model/comment";
export type { Comment as CommentSnapshot } from "@domain/model/comment";
export type {
  EngagementAvailability,
  EngagementPorts,
  EngagementSource,
  LikesGateway,
  MusicVideoCommentReader,
  PlayHistoryReader,
  PlayRecordPeriod,
  TrackCommentReader,
} from "@domain/ports/engagement";
