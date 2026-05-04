import React, { useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";

import type { Lyric } from "@kernel/model/lyric";

import { usePlanet } from "@/hooks/usePlanet";
import { useProvider } from "@/hooks/useProvider";
import { cn } from "@/lib/cn";
import { usePlayQueueStore } from "@/store/playqueue";

/**
 * 在已按 duration 升序的 lyrics 中找最后一个 duration <= currentMs 的索引。
 * 没有匹配（playhead 在第一行之前）返回 -1。
 */
function findActiveIndex(lyrics: readonly Lyric[], currentMs: number): number {
  let lo = 0;
  let hi = lyrics.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lyrics[mid].duration <= currentMs) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

const Hint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-full items-center justify-center text-sm text-text-muted">
    {children}
  </div>
);

export interface LyricPanelProps {
  className?: string;
}

export const LyricPanel: React.FC<LyricPanelProps> = ({ className }) => {
  const planet = usePlanet();
  const provider = useProvider();
  const supports = provider.supports("lyric");

  // 全部 React 状态从 store 读，避免 mount 晚于事件
  const track = usePlayQueueStore.use.track();
  const progress = usePlayQueueStore.use.progress();
  const duration = usePlayQueueStore.use.duration();
  const currentMs = progress.duration * 1000; // store 内 duration 是秒
  const totalSeconds = duration.duration;

  const trackId = track?.id;
  const enabled = !!trackId && supports;

  const { data: lyrics = [], isLoading, isError } = useQuery({
    queryKey: ["lyric", provider.name, trackId],
    queryFn: () => provider.lyric(trackId!),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const activeIndex = useMemo(
    () => findActiveIndex(lyrics, currentMs),
    [lyrics, currentMs],
  );

  const scrollerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const didFirstScrollRef = useRef(false);

  useEffect(() => {
    if (activeIndex < 0) return;
    const scroller = scrollerRef.current;
    const el = lineRefs.current[activeIndex];
    if (!scroller || !el) return;

    const compute = () => {
      const lineRect = el.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      const offsetWithinScroller =
        lineRect.top - scrollerRect.top + scroller.scrollTop;
      const target =
        offsetWithinScroller - scroller.clientHeight / 2 + lineRect.height / 2;
      const behavior: ScrollBehavior = didFirstScrollRef.current
        ? "smooth"
        : "auto";
      didFirstScrollRef.current = true;
      scroller.scrollTo({ top: Math.max(0, target), behavior });
    };

    const raf = requestAnimationFrame(compute);
    return () => cancelAnimationFrame(raf);
  }, [activeIndex]);

  // 每次切歌重置首次滚动标记
  useEffect(() => {
    didFirstScrollRef.current = false;
  }, [trackId]);

  const seekTo = (line: Lyric) => {
    if (totalSeconds <= 0 || !Number.isFinite(totalSeconds)) return;
    const percent = Math.min(
      100,
      Math.max(0, (line.duration / 1000 / totalSeconds) * 100),
    );
    planet.hooks.emit("play_time_seek", percent);
  };

  if (!supports) {
    return (
      <Hint>This source ({provider.name}) does not provide lyrics.</Hint>
    );
  }
  if (!trackId) {
    return <Hint>Pick a track to see its lyrics.</Hint>;
  }
  if (isLoading) {
    return <Hint>Loading lyrics…</Hint>;
  }
  if (isError) {
    return <Hint>Failed to load lyrics.</Hint>;
  }
  if (lyrics.length === 0) {
    return <Hint>No lyrics available for this track.</Hint>;
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div
        ref={scrollerRef}
        className="scrollbar-spotify relative flex-1 overflow-y-auto overscroll-contain px-6 pb-[40vh] pt-[40vh]"
      >
        {lyrics.map((line, i) => {
          const distance = activeIndex < 0 ? 99 : Math.abs(i - activeIndex);
          const isActive = i === activeIndex;
          // 距离衰减 + 模糊：远离活跃行的 line 不仅淡也微模糊，纵深感
          const opacity = isActive
            ? 1
            : Math.max(0.25, 0.8 - distance * 0.12);
          const blur = isActive ? 0 : Math.min(1.5, distance * 0.4);
          return (
            <motion.div
              key={i}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              onClick={() => seekTo(line)}
              animate={{
                opacity,
                filter: blur ? `blur(${blur}px)` : "blur(0px)",
              }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className={cn(
                "group flex cursor-pointer select-none flex-col items-center gap-2 rounded-md py-3 text-center transition-colors",
                isActive
                  ? "text-white"
                  : "text-white/55 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "max-w-[36ch] leading-snug",
                  isActive
                    ? "text-[26px] font-bold"
                    : "text-[15px] font-normal",
                )}
              >
                {line.content || "♪"}
              </span>
              {isActive && (
                <motion.span
                  layoutId="lyric-active-bar"
                  className="block h-[2px] w-10 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 350, damping: 32 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LyricPanel;
