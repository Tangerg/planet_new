import * as React from "react";
import { motion } from "motion/react";
import { Clock, Heart, Play } from "lucide-react";

import { Track } from "../../../packages/model/track";
import {
  formatDuration,
  Minute,
  Second,
} from "../../../packages/shared-utils/time";
import { cn } from "../../lib/cn";

interface TrackListProps {
  tracks: Track[];
  hiddenAlbum?: boolean;
  onRowClick?: (item: Track, items?: Track[]) => void;
}

/**
 * # | Title (cover + name + artist) | Album | Duration | Heart
 * - hiddenAlbum=true 时省略 Album 列。
 * - Heart 列只在 hover 时显示，已 like 状态保持显示。
 */
const TrackList: React.FC<TrackListProps> = ({
  tracks,
  hiddenAlbum,
  onRowClick,
}) => {
  // 仅 demo：每个 track 的 like 状态留在本地，无持久化
  const [liked, setLiked] = React.useState<Record<string, boolean>>({});

  if (!tracks?.length) {
    return (
      <div className="px-6 py-10 text-sm text-text-muted">No tracks yet.</div>
    );
  }

  const gridCols = hiddenAlbum
    ? "grid-cols-[40px_1fr_60px_40px]"
    : "grid-cols-[40px_2fr_1.5fr_60px_40px]";

  return (
    <div className="px-3 pb-6">
      {/* Header */}
      <div
        className={cn(
          "grid items-center gap-4 px-3 py-2 text-[11px] uppercase tracking-button text-text-muted border-b border-white/5",
          gridCols,
        )}
      >
        <span className="text-right pr-2">#</span>
        <span>Title</span>
        {!hiddenAlbum && <span>Album</span>}
        <span className="flex justify-end">
          <Clock size={14} />
        </span>
        <span />
      </div>

      {/* Rows */}
      <ul>
        {tracks.map((item, idx) => {
          const isLiked = !!liked[item.id];
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.015, 0.3), duration: 0.18 }}
              onClick={() => onRowClick?.(item, tracks)}
              className={cn(
                "group grid items-center gap-4 px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-white/5",
                gridCols,
              )}
            >
              <span className="relative flex w-10 items-center justify-end pr-2 text-sm tabular-nums text-text-muted">
                <span className="group-hover:opacity-0">
                  {item.index ?? idx + 1}
                </span>
                <Play
                  size={14}
                  fill="currentColor"
                  className="absolute right-2 hidden text-white group-hover:inline-block"
                />
              </span>

              <div className="flex min-w-0 items-center gap-3">
                {item.album?.image && (
                  <img
                    src={item.album.image}
                    alt={item.name}
                    className="h-10 w-10 shrink-0 rounded-md object-cover"
                  />
                )}
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-bold text-white">
                    {item.name}
                  </span>
                  <span className="truncate text-xs text-text-muted">
                    {item.artists?.slice(0, 3).map((a) => a.name).join(", ")}
                    {(item.artists?.length ?? 0) > 3 ? "…" : ""}
                  </span>
                </div>
              </div>

              {!hiddenAlbum && (
                <span className="truncate text-sm text-text-muted">
                  {item.album?.name}
                </span>
              )}

              <span className="flex justify-end text-xs tabular-nums text-text-muted">
                {formatDuration(item.duration, [Minute, Second])}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLiked((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
                }}
                aria-label={isLiked ? "Remove from Liked" : "Add to Liked"}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  isLiked
                    ? "text-accent"
                    : "text-text-muted opacity-0 hover:text-white group-hover:opacity-100",
                )}
              >
                <Heart
                  size={16}
                  className={cn(isLiked && "fill-accent text-accent")}
                />
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
};

export default TrackList;
