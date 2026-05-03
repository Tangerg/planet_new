import React from "react";
import { motion } from "motion/react";
import { Play } from "lucide-react";

import { cn } from "../../lib/cn";

interface CardProps {
  thumbnail: string;
  shape?: "circular" | "rounded";
  title: string;
  subTitle?: string;
}

/**
 * Spotify 风格卡片：封面在上，标题/副标题在下方。
 * Hover：scale 1.2 + 重 drop-shadow + saturate；右下角弹出 accent 播放键。
 */
export const Card: React.FC<CardProps> = ({
  thumbnail,
  shape = "rounded",
  title,
  subTitle,
}) => {
  if (shape === "circular") {
    return (
      <motion.div
        whileHover={{ scale: 1.06, zIndex: 10 }}
        whileTap={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="group relative cursor-pointer rounded-md p-3 text-center"
      >
        <div className="relative mx-auto mb-3 aspect-square w-full max-w-[180px]">
          <div
            className={cn(
              "h-full w-full overflow-hidden rounded-full bg-surface-2 shadow-elevated",
              "transition-shadow duration-200",
              "group-hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85),0_0_30px_-5px_rgba(0,0,0,0.5)]",
            )}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={title}
                className="h-full w-full object-cover transition-[filter] duration-300 group-hover:saturate-125"
                loading="lazy"
                draggable={false}
              />
            ) : null}
          </div>
          {/* hover 时右下角淡入 play（不位移，跟卡片缩放同步出现） */}
          <div
            className="pointer-events-none absolute bottom-1 right-1 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-black opacity-0 shadow-dialog transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100"
          >
            <Play size={18} fill="currentColor" />
          </div>
        </div>
        <h5 className="line-clamp-2 min-h-[2lh] text-sm font-bold text-white">
          {title}
        </h5>
        <p className="line-clamp-1 text-xs text-text-muted">
          {subTitle || "\u00A0"}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.1, zIndex: 10 }}
      whileTap={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="group relative cursor-pointer rounded-md bg-surface p-3 transition-colors hover:bg-surface-3"
    >
      {/* 封面 */}
      <div
        className={cn(
          "relative mb-3 aspect-square w-full overflow-hidden rounded-md",
          "bg-surface-2 shadow-elevated transition-shadow duration-200",
          "group-hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.9),0_18px_36px_-18px_rgba(0,0,0,0.75)]",
        )}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="h-full w-full object-cover transition-[filter] duration-300 group-hover:saturate-125"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full bg-surface-2" />
        )}

        {/* hover 时右下角淡入 play（不位移，跟卡片缩放同步出现） */}
        <div
          className="pointer-events-none absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-black opacity-0 shadow-dialog transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100"
        >
          <Play size={18} fill="currentColor" />
        </div>
      </div>

      {/* 文字区：强制对齐
            - 标题：始终保留 2 行高度，长内容超过 2 行 ellipsis
            - 副标题：固定 1 行高度，缺失时占位 */}
      <div className="flex flex-col gap-1">
        <h5 className="line-clamp-2 min-h-[2lh] text-base font-bold leading-tight text-white">
          {title}
        </h5>
        <p className="line-clamp-1 text-sm text-text-muted">
          {subTitle || "\u00A0"}
        </p>
      </div>
    </motion.div>
  );
};

export const CardFlow: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="grid grid-cols-2 gap-3 px-1 py-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
    {children}
  </div>
);

export default CardFlow;
