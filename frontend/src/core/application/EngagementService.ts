import type {
  EngagementAvailability,
  EngagementSource,
  PlayRecordPeriod,
} from "@domain/ports/engagement";
import type { Comment } from "@domain/model/comment";
import type { ProviderId } from "@domain/model/provider-id";
import type { TrackSnapshot } from "@domain/model/track";
import { QueryFailedError, QueryResult, type QueryResult as Result } from "./QueryResult";

/** Provider-backed user relationships and social reads. Session-only UI
 * history remains outside this service because it is presentation state. */
export class EngagementService {
  constructor(private readonly getSource: () => EngagementSource) {}

  get providerId(): ProviderId {
    return this.getSource().providerId;
  }

  get availability(): EngagementAvailability {
    const ports = this.getSource().engagement;
    return {
      likes: ports.likes !== null,
      playHistory: ports.playHistory !== null,
      trackComments: ports.trackComments !== null,
      musicVideoComments: ports.musicVideoComments !== null,
    };
  }

  likedTrackIds(): Promise<Result<string[]>> {
    const source = this.getSource();
    return this.read(source, source.engagement.likes, "likedTrackIds", (port) =>
      port.likedTrackIds(),
    );
  }

  setLiked(trackId: string, liked: boolean): Promise<void> {
    const source = this.getSource();
    if (!source.engagement.likes) {
      throw new Error(`Provider ${source.name} does not support likes.`);
    }
    return source.engagement.likes.setLiked(trackId, liked);
  }

  playRecord(period: PlayRecordPeriod): Promise<Result<TrackSnapshot[]>> {
    const source = this.getSource();
    return this.read(source, source.engagement.playHistory, `playRecord(${period})`, (port) =>
      port.playRecord(period),
    );
  }

  comments(trackId: string): Promise<Result<Comment[]>> {
    const source = this.getSource();
    return this.read(source, source.engagement.trackComments, "comments", (port) =>
      port.comments(trackId),
    );
  }

  musicVideoComments(musicVideoId: string): Promise<Result<Comment[]>> {
    const source = this.getSource();
    return this.read(source, source.engagement.musicVideoComments, "musicVideoComments", (port) =>
      port.musicVideoComments(musicVideoId),
    );
  }

  private async read<Port, T>(
    source: EngagementSource,
    port: Port | null,
    operation: string,
    read: (port: Port) => Promise<T>,
  ): Promise<Result<T>> {
    if (!port) return QueryResult.unsupported();
    try {
      return QueryResult.success(await read(port));
    } catch (cause) {
      return QueryResult.failed(new QueryFailedError(source.name, operation, { cause }));
    }
  }
}
