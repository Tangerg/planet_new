// ============================================================
// CommentList — the shared track-comment list (avatar · name · relative time ·
// content · like count), with an honest empty fallback. Used by both the
// Comments screen and Now Playing's comments mode.
// ============================================================
import React from "react";
import { useTranslation } from "react-i18next";
import type { VibeComment } from "@/model/vibe";
import { Art } from "@/components/primitives";
import { Icon } from "@/infra/icons";
import { Empty } from "@/components/layout/Empty";
import { localize } from "@/i18n/text";
import { relativeTimeText } from "@/model/relative-time";
import { relativeTime } from "@shared/time";

export function CommentList({ comments }: { comments: VibeComment[] }) {
  const { t, i18n } = useTranslation();
  // One clock read for the whole list, so its ages are consistent with each other.
  const now = Date.now();
  if (!comments.length) return <Empty className="py-[50px]">{t("comments.empty")}</Empty>;
  return (
    <div className="flex max-w-[680px] flex-col gap-7">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-3.5">
          <Art images={c.avatar} px={36} grain={false} className="h-9 w-9 flex-none rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2.5">
              <span className="truncate text-[13px] text-white/80">{c.name}</span>
              <span className="mlabel flex-none text-[10px] text-tx-3">
                {localize(t, relativeTimeText(relativeTime(c.postedAt, now), i18n.language))}
              </span>
            </div>
            <div className="mt-1 text-[14px] font-light leading-relaxed text-white/[0.85] [overflow-wrap:anywhere]">
              {c.content}
            </div>
            {c.likedCount > 0 && (
              <div className="mt-1.5 inline-flex items-center gap-1 text-tx-3">
                <Icon.heart size={12} /> <span className="text-[11px]">{c.likedCount}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
