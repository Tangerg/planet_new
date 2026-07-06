import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { activeLyricIndex, type Lyric } from "@domain/model/lyric";

import { usePlaybackProgress } from "@/hooks/usePlaybackProgress";
import {
  isNowPlayingCommentsMode,
  isNowPlayingLyricsMode,
  isNowPlayingPanelOpen,
  lyricLinesOrFallback,
  normalizeNowPlayingMode,
  swipeAction,
  toggleNowPlayingLyricsMode,
  type NowPlayingMode,
} from "@/model/now-playing";

type Options = {
  lyrics: readonly Lyric[];
  initialMode: string;
  noLyricsText?: string;
  onNext?: () => void;
  onPrev?: () => void;
};

/**
 * Behavior for the Now Playing screen: view mode (cover / lyrics / comments),
 * the up-next queue sheet, lyric auto-advance against live playback, and axis
 * navigation shared by keyboard and swipe (Up = lyrics, Down = queue,
 * Left/Right = skip). Extracting it leaves the screen as pure layout.
 */
export function useNowPlayingModel({ lyrics, initialMode, noLyricsText, onNext, onPrev }: Options) {
  // Read the live clock here (not threaded from Shell) so only Now Playing
  // re-renders on the progress tick — see usePlaybackProgress.
  const { positionSec: progressSec } = usePlaybackProgress();
  const [mode, setMode] = useState<NowPlayingMode>(() => normalizeNowPlayingMode(initialMode));
  const [queueOpen, setQueueOpen] = useState(false); // down axis = queue

  // Portal target for the queue Sheet; the two scroll containers auto-center.
  const rootRef = useRef<HTMLDivElement>(null);
  const lyricScrollRef = useRef<HTMLDivElement>(null);
  const queueScrollRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Memoized so the auto-advance effect depends on a stable value (the fallback
  // array literal would otherwise be new every render).
  const lines = useMemo(() => lyricLinesOrFallback(lyrics, noLyricsText), [lyrics, noLyricsText]);
  const [active, setActive] = useState(0);

  // Sync the active lyric line to real progress. Timestamps are ms; progress is s.
  useEffect(() => {
    const idx = activeLyricIndex(lines, progressSec * 1000);
    setActive((prev) => (prev === idx ? prev : idx));
  }, [progressSec, lines]);

  // Up axis navigation: close the queue if it's open, otherwise flip lyrics/cover.
  useEffect(() => {
    // capture phase wins over the global spatial-nav handler
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setQueueOpen(true);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        if (queueOpen) setQueueOpen(false);
        else setMode(toggleNowPlayingLyricsMode);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [queueOpen]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const action = swipeAction(t.clientX - touchStart.current.x, t.clientY - touchStart.current.y);
    touchStart.current = null;
    if (action === "next") onNext?.();
    else if (action === "prev") onPrev?.();
    else if (action === "down") setQueueOpen(true);
    else if (action === "up") {
      if (queueOpen) setQueueOpen(false);
      else setMode(toggleNowPlayingLyricsMode);
    }
  };

  return {
    mode,
    setMode,
    queueOpen,
    setQueueOpen,
    lines,
    active,
    lyricsMode: isNowPlayingLyricsMode(mode),
    commentsMode: isNowPlayingCommentsMode(mode),
    panelOpen: isNowPlayingPanelOpen(mode),
    rootRef,
    lyricScrollRef,
    queueScrollRef,
    touchHandlers: { onTouchStart, onTouchEnd },
  };
}
