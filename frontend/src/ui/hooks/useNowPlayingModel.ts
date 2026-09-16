import type React from "react";
import { useEffect, useRef, useState } from "react";

import {
  isNowPlayingCommentsMode,
  isNowPlayingLyricsMode,
  isNowPlayingPanelOpen,
  swipeAction,
  toggleNowPlayingLyricsMode,
  type NowPlayingMode,
} from "@/model/now-playing";

type Options = {
  initialMode: NowPlayingMode;
  onNext?: () => void;
  onPrev?: () => void;
};

export function useNowPlayingModel({ initialMode, onNext, onPrev }: Options) {
  const [mode, setMode] = useState<NowPlayingMode>(initialMode);
  const [queueOpen, setQueueOpen] = useState(false);

  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const queueScrollRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && queueOpen) {
        e.preventDefault();
        e.stopPropagation();
        setQueueOpen(false);
      } else if (e.key === "ArrowDown") {
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
    lyricsMode: isNowPlayingLyricsMode(mode),
    commentsMode: isNowPlayingCommentsMode(mode),
    panelOpen: isNowPlayingPanelOpen(mode),
    root,
    setRoot,
    queueScrollRef,
    touchHandlers: { onTouchStart, onTouchEnd },
  };
}
