import type { Comment } from "@domain/model/comment";
import { relativeTime } from "@shared/time";

import type { VibeComment } from "@/model/vibe";

export function toVibeComment(comment: Comment): VibeComment {
  return {
    id: comment.id,
    name: comment.user.name,
    avatar: comment.user.avatar,
    content: comment.content,
    likedCount: comment.likedCount,
    timeLabel: relativeTime(comment.time),
  };
}
