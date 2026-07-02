// ============================================================
// Comments — track comments (left cover + right list). Providers that expose a
// comment endpoint (NCM) fill the list; others fall back to an honest empty state.
// ============================================================
import React from "react";
import type { VibeComment, VibeTrack } from "@/model/vibe";
import { Art } from "@/components/primitives";
import { LikeHeart } from "@/components/controls/LikeHeart";
import { CommentList } from "@/components/CommentList";
import { FadeIn } from "@/components/motion";
import { useTranslation } from "react-i18next";

type CommentsScreenProps = {
  track?: VibeTrack;
  comments: VibeComment[];
  accent: string;
  liked: boolean;
  toggleLike: () => void;
  mono: boolean;
};

export function CommentsScreen({
  track,
  comments,
  accent,
  liked,
  toggleLike,
  mono,
}: CommentsScreenProps) {
  const { t } = useTranslation();
  return (
    <FadeIn
      className="grid h-full bg-surf-0"
      style={{ gridTemplateColumns: "minmax(0, 0.78fr) minmax(0, 1.22fr)" }}
    >
      <Art
        seed={track?.coverSeed || 0}
        grad={track?.gradient}
        image={track?.image}
        images={track?.images}
        mono={mono}
        data-hero="1"
        className="h-full"
      >
        <div
          className="absolute inset-0 z-[2]"
          style={{ background: "linear-gradient(180deg, rgba(8,8,11,.25), rgba(8,8,11,.6))" }}
        />
        {/* Top tags + bottom title via flow (space-between column), not absolute. */}
        <div className="relative z-[4] flex h-full flex-col items-start justify-between px-12 pb-[44px] pt-[60px]">
          <div className="flex flex-col items-start gap-[14px]">
            <LikeHeart liked={liked} onToggle={toggleLike} accent={accent} />
            <span className="pill-accent">{track?.quality || "SQ"}</span>
          </div>
          <div className="max-w-full">
            <div className="inline-block max-w-full truncate border-b border-white/30 pb-2.5 text-[28px] font-light">
              {track?.title}
            </div>
            <div className="mt-2.5 truncate text-[15px] font-light text-tx-3">{track?.artist}</div>
          </div>
        </div>
      </Art>
      <div className="scroll h-full px-12 pb-10 pt-[60px]">
        <div
          className="mb-6 inline-block pb-3 text-[28px] font-extralight tracking-[0.06em]"
          style={{ borderBottom: `2px solid ${accent}` }}
        >
          {t("comments.title")}
        </div>
        <CommentList comments={comments} />
      </div>
    </FadeIn>
  );
}
