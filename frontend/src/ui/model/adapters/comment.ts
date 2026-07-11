import { Comment, type CommentSnapshot } from "@contexts/engagement";

import type { VibeComment } from "@/model/vibe";

export function toVibeComment(comment: CommentSnapshot): VibeComment {
  return {
    id: comment.id,
    name: comment.user.name,
    avatar: comment.user.avatar,
    content: comment.content,
    likedCount: comment.likedCount,
    timeLabel: Comment.timeLabel(comment),
  };
}

export const toVibeComments = (comments?: readonly CommentSnapshot[]) =>
  (comments ?? []).map((comment) => toVibeComment(comment));
