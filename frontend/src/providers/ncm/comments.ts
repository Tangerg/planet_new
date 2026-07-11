import type { KyInstance } from "ky";

import { Comment } from "@domain/model/comment";

import { mapNcmComment } from "./mapper";
import type { NcmCommentsResponse } from "./types";

async function fetchComments(http: KyInstance, endpoint: string, id: string): Promise<Comment[]> {
  const res = await http
    .get(endpoint, { searchParams: { id, limit: 30 } })
    .json<NcmCommentsResponse>();
  return Comment.mergeThreads(
    (res.hotComments ?? []).map(mapNcmComment),
    (res.comments ?? []).map(mapNcmComment),
  );
}

export function fetchNcmTrackComments(http: KyInstance, trackId: string): Promise<Comment[]> {
  return fetchComments(http, "comment/music", trackId);
}

export function fetchNcmMusicVideoComments(
  http: KyInstance,
  musicVideoId: string,
): Promise<Comment[]> {
  return fetchComments(http, "comment/mv", musicVideoId);
}
