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

// Hotkey option presets — stable refs so the hooks don't re-register each render.
const HK_IGNORE_INPUTS = { ignoreInputs: true }; // Mod combos must NOT clobber text editing
const HK_PASSIVE = { preventDefault: false, stopPropagation: false }; // Space yields to focused controls
const VOLUME_STEP = 5;

export type GlobalShortcutHandlers = {
  /** Current view — guards (don't re-open Search while on it, etc.). */
  view: string;
  goBack: () => void;
  openSearch: () => void;
  navigate: (view: string) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  volume: number;
  setVolume: (v: number) => void;
  /** Active track id (undefined when nothing is playing → like is a no-op). */
  currentId?: string;
  toggleLike: (id: string) => void;
};

export function useGlobalShortcuts(h: GlobalShortcutHandlers): void {
  const {
    view,
    goBack,
    openSearch,
    navigate,
    togglePlay,
    playNext,
    playPrev,
    volume,
    setVolume,
    currentId,
    toggleLike,
  } = h;

  useHotkey("Escape", () => void (view !== "xmb" && goBack()));
  useHotkey("/", () => void (view !== "search" && openSearch()));
  useHotkey("Mod+F", () => void (view !== "search" && openSearch()));
  // Transport / library — NetEase-style
  useHotkey("Mod+ArrowLeft", () => playPrev(), HK_IGNORE_INPUTS);
  useHotkey("Mod+ArrowRight", () => playNext(), HK_IGNORE_INPUTS);
  useHotkey("Mod+ArrowUp", () => setVolume(Math.min(100, volume + VOLUME_STEP)), HK_IGNORE_INPUTS);
  useHotkey("Mod+ArrowDown", () => setVolume(Math.max(0, volume - VOLUME_STEP)), HK_IGNORE_INPUTS);
  useHotkey("Mod+L", () => void (currentId && toggleLike(currentId)), HK_IGNORE_INPUTS);
  // ⌘R toggles the Now Playing surface (closest to NetEase's "lyrics" toggle).
  useHotkey("Mod+R", () => (view === "np" ? goBack() : navigate("np")), HK_IGNORE_INPUTS);
  // Space = play/pause, but yield to a focused control so it can handle Space (a11y).
  useHotkey(
    "Space",
    (e) => {
      const el = document.activeElement;
      if (
        el?.closest('button, a, input, textarea, select, [role="button"], [contenteditable="true"]')
      ) {
        return;
      }
      e.preventDefault();
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
      if (e.key !== "Shift") {
        lastShiftAt = 0; // any other key breaks the double-tap
        return;
      }
      if (e.repeat) return;
      const el = document.activeElement;
      if (el?.closest("input, textarea, [contenteditable='true']")) return;
      if (e.timeStamp - lastShiftAt < 400 && view !== "search") {
        lastShiftAt = 0;
        openSearch();
      } else {
        lastShiftAt = e.timeStamp;
      }
    };
    window.addEventListener("keydown", onShift);
    return () => window.removeEventListener("keydown", onShift);
  }, [view, openSearch]);
}
