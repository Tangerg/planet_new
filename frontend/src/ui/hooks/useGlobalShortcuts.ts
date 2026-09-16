import { useEffect } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { nextVolumeLevel } from "@/model/player";
import type { ShellScreenView } from "@/model/shell-screen";
import type { VibeTrack } from "@/model/vibe";
import {
  canUsePlaybackShortcut,
  elementMatchesClosest,
  nowPlayingShortcutDecision,
  shiftSearchDecision,
  shouldGoBackFromShortcut,
  shouldGoHomeFromShortcut,
  shouldOpenSearchFromShortcut,
  SPACE_HANDLED_BY_FOCUSED_CONTROL_SELECTOR,
  TEXT_ENTRY_SELECTOR,
} from "@/model/shortcuts";

const HK_IGNORE_INPUTS = { ignoreInputs: true };
const HK_PASSIVE = { preventDefault: false, stopPropagation: false };

export type GlobalShortcutHandlers = {
  view: ShellScreenView;
  goBack: () => void;
  goHome: () => void;
  openSearch: () => void;
  navigate: (view: ShellScreenView) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  volume: number;
  setVolume: (v: number) => void;
  currentTrack?: VibeTrack;
  hasCurrentTrack: boolean;
  toggleLike: (track: VibeTrack) => void;
};

export function useGlobalShortcuts(h: GlobalShortcutHandlers): void {
  const {
    view,
    goBack,
    goHome,
    openSearch,
    navigate,
    togglePlay,
    playNext,
    playPrev,
    volume,
    setVolume,
    currentTrack,
    hasCurrentTrack,
    toggleLike,
  } = h;
  const playbackShortcutEnabled = canUsePlaybackShortcut(view);

  useHotkey("Escape", () => void (shouldGoBackFromShortcut(view) && goBack()));
  useHotkey("/", () => void (shouldGoHomeFromShortcut(view) && goHome()));
  useHotkey("Mod+F", () => void (shouldOpenSearchFromShortcut(view) && openSearch()));
  useHotkey("Mod+ArrowLeft", () => void (playbackShortcutEnabled && playPrev()), HK_IGNORE_INPUTS);
  useHotkey("Mod+ArrowRight", () => void (playbackShortcutEnabled && playNext()), HK_IGNORE_INPUTS);
  useHotkey("Mod+ArrowUp", () => setVolume(nextVolumeLevel(volume, "up")), HK_IGNORE_INPUTS);
  useHotkey("Mod+ArrowDown", () => setVolume(nextVolumeLevel(volume, "down")), HK_IGNORE_INPUTS);
  useHotkey(
    "Mod+L",
    () => {
      if (currentTrack) toggleLike(currentTrack);
    },
    HK_IGNORE_INPUTS,
  );
  useHotkey(
    "Mod+R",
    () => {
      const decision = nowPlayingShortcutDecision(view, hasCurrentTrack);
      if (decision === "back") goBack();
      else if (decision === "open") navigate("np");
    },
    HK_IGNORE_INPUTS,
  );
  useHotkey(
    "Space",
    (e) => {
      if (
        elementMatchesClosest(document.activeElement, SPACE_HANDLED_BY_FOCUSED_CONTROL_SELECTOR)
      ) {
        return;
      }
      e.preventDefault();
      if (!playbackShortcutEnabled) return;
      togglePlay();
    },
    HK_PASSIVE,
  );

  useEffect(() => {
    let lastShiftAt = 0;
    const onShift = (e: KeyboardEvent) => {
      const decision = shiftSearchDecision({
        key: e.key,
        repeat: e.repeat,
        timeStamp: e.timeStamp,
        lastShiftAt,
        typing: elementMatchesClosest(document.activeElement, TEXT_ENTRY_SELECTOR),
        alreadyInSearch: view === "search",
      });
      lastShiftAt = decision.lastShiftAt;
      if (decision.openSearch) {
        openSearch();
      }
    };
    window.addEventListener("keydown", onShift);
    return () => window.removeEventListener("keydown", onShift);
  }, [view, openSearch]);
}
