import type { Comment } from "../model/comment";
import type { TrackSnapshot } from "../model/track";
import type { ProviderIdentity } from "./source";

export type PlayRecordPeriod = "week" | "all";

export interface LikesGateway {
  likedTrackIds(): Promise<string[]>;
  setLiked(trackId: string, liked: boolean): Promise<void>;
}

export interface PlayHistoryReader {
  playRecord(period: PlayRecordPeriod): Promise<TrackSnapshot[]>;
}

export interface TrackCommentReader {
  comments(trackId: string): Promise<Comment[]>;
}

export interface MusicVideoCommentReader {
  musicVideoComments(musicVideoId: string): Promise<Comment[]>;
}

export interface EngagementPorts {
  readonly likes: LikesGateway | null;
  readonly playHistory: PlayHistoryReader | null;
  readonly trackComments: TrackCommentReader | null;
  readonly musicVideoComments: MusicVideoCommentReader | null;
}

export type EngagementAvailability = Readonly<{
  likes: boolean;
  playHistory: boolean;
  trackComments: boolean;
  musicVideoComments: boolean;
}>;

export interface EngagementSource extends ProviderIdentity {
  readonly engagement: EngagementPorts;
}
