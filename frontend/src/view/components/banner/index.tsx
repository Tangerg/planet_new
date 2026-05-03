import React from "react";
import { motion } from "motion/react";
import { Play } from "lucide-react";

import { User } from "../../../packages/model/user";
import { formatDurationMillisecond } from "../../../packages/shared-utils/time";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";

interface BannerProps {
  category: "Album" | "Playlist";
  title: string;
  image: string;
  user: User;
  time: number;
  trackCount: number;
  durationCount: number;
  onPlay?: () => void;
}

/** 把毫秒级时长格式化成 "1 hr 23 min 45 sec" 的人类可读形式 */
const formatHumanDuration = (duration: number): string => {
  const dur = formatDurationMillisecond(duration);
  const [h, m, s] = dur.split(":").map(Number);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hr`);
  if (m > 0) parts.push(`${m} min`);
  parts.push(`${s} sec`);
  return parts.join(" ");
};

/**
 * Spotify-style banner：顶部一段从专辑色淡出的暗色调，左封面 + 右标题/元信息。
 * 不做全幅模糊背景，不写 watermark 大字 —— 让封面是封面，UI 仍 achromatic。
 */
const Banner: React.FC<BannerProps> = ({
  category,
  title,
  image,
  user,
  time,
  trackCount,
  durationCount,
  onPlay,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="relative w-full"
    >
      {/* 背景由外层 CoverAmbientBg 提供 */}
      <div className="relative flex items-end gap-6 px-6 pt-12 pb-6">
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="relative h-56 w-56 shrink-0 overflow-hidden rounded-md bg-surface-2 shadow-dialog"
        >
          {image ? (
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : null}
        </motion.div>

        <div className="flex min-w-0 flex-1 flex-col justify-end gap-3 pb-2">
          <div className="text-button-uppercase text-text-muted">{category}</div>
          <h1 className="font-title text-5xl font-extrabold leading-tight text-white">
            {title}
          </h1>
          <div className="flex items-center gap-2 text-sm text-white">
            <Avatar className="h-6 w-6">
              {user.image ? <AvatarImage src={user.image} /> : null}
              <AvatarFallback>{user.nickname?.[0] ?? "U"}</AvatarFallback>
            </Avatar>
            <span className="font-bold">{user.nickname}</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted">
              {new Date(time).getFullYear()}
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted">
              {trackCount} songs, {formatHumanDuration(durationCount)}
            </span>
          </div>

          {onPlay && (
            <div className="pt-3">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={onPlay}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-black shadow-elevated"
                aria-label="Play"
              >
                <Play size={20} fill="currentColor" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default Banner;
