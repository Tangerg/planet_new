/**
 * Global keyboard shortcuts — discrete, app-wide commands (transport, search,
 * surfaces), bound via TanStack Hotkeys plus a tiny double-Shift detector.
 *
 * Scope boundary: this owns *discrete* shortcuts only. Directional arrow-key
 * navigation lives in useSpatialNavigation (it is coupled to focus geometry and
 * the morph engine, which the hotkey lib doesn't model). Smart defaults:
 * Escape/Mod fire even inside inputs; single keys are ignored while typing. The
 * Mod+Arrow / Mod+L combos force ignoreInputs so they never clobber in-field
 * text editing (e.g. ⌘← = line-start) inside the search box.
 */
import { useEffect } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { nextVolumeLevel } from "@/model/player";
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

// Hotkey option presets — stable refs so the hooks don't re-register each render.
const HK_IGNORE_INPUTS = { ignoreInputs: true }; // Mod combos must NOT clobber text editing
const HK_PASSIVE = { preventDefault: false, stopPropagation: false }; // Space yields to focused controls

export type GlobalShortcutHandlers = {
  /** Current view — guards (don't re-open Search while on it, etc.). */
  view: string;
  goBack: () => void;
  /** Jump straight to the XMB root from any depth (the "/" shortcut). */
  goHome: () => void;
  openSearch: () => void;
  navigate: (view: string) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  volume: number;
  setVolume: (v: number) => void;
  /** Active source-qualified track (undefined when nothing is playing). */
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
  // "/" jumps to the XMB root (Search has its own: ⌘F + double-Shift). Ignored
  // while typing (single-key default), so it won't fire inside the search box.
  useHotkey("/", () => void (shouldGoHomeFromShortcut(view) && goHome()));
  useHotkey("Mod+F", () => void (shouldOpenSearchFromShortcut(view) && openSearch()));
  // Transport / library — NetEase-style
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
  // ⌘R toggles the Now Playing surface (closest to NetEase's "lyrics" toggle).
  useHotkey(
    "Mod+R",
    () => {
      const decision = nowPlayingShortcutDecision(view, hasCurrentTrack);
      if (decision === "back") goBack();
      else if (decision === "open") navigate("np");
    },
    HK_IGNORE_INPUTS,
  );
  // Space = play/pause, but yield to a focused control so it can handle Space (a11y).
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

  /* Double-tap Shift opens Search (IntelliJ-style). A bare-modifier double-tap isn't
     something the hotkey lib models, so this small detector owns it: two Shift
     keydowns within 400ms, nothing else pressed between, and not while typing. */
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
