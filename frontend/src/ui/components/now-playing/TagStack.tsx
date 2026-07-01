import type { ReactNode } from "react";

import { LikeHeart } from "@/components/controls/LikeHeart";

type Props = {
  accent: string;
  liked: boolean;
  toggleLike: () => void;
  extra?: ReactNode;
};

export function TagStack({ accent, liked, toggleLike, extra }: Props) {
  return (
    <div className="absolute left-12 top-16 z-[6] flex flex-col items-start gap-[14px]">
      <LikeHeart liked={liked} onToggle={toggleLike} accent={accent} />
      {extra}
    </div>
  );
}
