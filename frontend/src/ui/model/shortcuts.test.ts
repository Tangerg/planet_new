import { describe, expect, it } from "vitest";

import {
  canUsePlaybackShortcut,
  DOUBLE_SHIFT_SEARCH_WINDOW_MS,
  nowPlayingShortcutDecision,
  shiftSearchDecision,
  shouldGoBackFromShortcut,
  shouldGoHomeFromShortcut,
  shouldOpenSearchFromShortcut,
  TEXT_ENTRY_SELECTOR,
} from "./shortcuts";

describe("shortcut model", () => {
  it("opens search on a double Shift inside the time window", () => {
    const first = shiftSearchDecision({
      key: "Shift",
      timeStamp: 1000,
      lastShiftAt: 0,
      typing: false,
      alreadyInSearch: false,
    });
    const second = shiftSearchDecision({
      key: "Shift",
      timeStamp: 1000 + DOUBLE_SHIFT_SEARCH_WINDOW_MS - 1,
      lastShiftAt: first.lastShiftAt,
      typing: false,
      alreadyInSearch: false,
    });

    expect(first.openSearch).toBe(false);
    expect(second).toEqual({ lastShiftAt: 0, openSearch: true });
  });

  it("keeps waiting when Shift is slow, repeated, typed into inputs, or already in search", () => {
    expect(
      shiftSearchDecision({
        key: "Shift",
        timeStamp: 1500,
        lastShiftAt: 1000,
        typing: false,
        alreadyInSearch: false,
      }),
    ).toEqual({ lastShiftAt: 1500, openSearch: false });

    expect(
      shiftSearchDecision({
        key: "Shift",
        repeat: true,
        timeStamp: 1100,
        lastShiftAt: 1000,
        typing: false,
        alreadyInSearch: false,
      }),
    ).toEqual({ lastShiftAt: 1000, openSearch: false });

    expect(
      shiftSearchDecision({
        key: "Shift",
        timeStamp: 1100,
        lastShiftAt: 1000,
        typing: true,
        alreadyInSearch: false,
      }),
    ).toEqual({ lastShiftAt: 1000, openSearch: false });

    expect(
      shiftSearchDecision({
        key: "Shift",
        timeStamp: 1100,
        lastShiftAt: 1000,
        typing: false,
        alreadyInSearch: true,
      }),
    ).toEqual({ lastShiftAt: 1100, openSearch: false });
  });

  it("resets the double-shift detector after any non-Shift key", () => {
    expect(
      shiftSearchDecision({
        key: "A",
        timeStamp: 1100,
        lastShiftAt: 1000,
        typing: false,
        alreadyInSearch: false,
      }),
    ).toEqual({ lastShiftAt: 0, openSearch: false });
  });

  it("keeps text-entry selector centralized for DOM boundary checks", () => {
    expect(TEXT_ENTRY_SELECTOR).toContain("input");
    expect(TEXT_ENTRY_SELECTOR).toContain("textarea");
    expect(TEXT_ENTRY_SELECTOR).toContain("contenteditable");
  });

  it("keeps global navigation shortcuts quiet on their home surface", () => {
    expect(shouldGoBackFromShortcut("xmb")).toBe(false);
    expect(shouldGoBackFromShortcut("detail")).toBe(true);
    expect(shouldGoHomeFromShortcut("xmb")).toBe(false);
    expect(shouldGoHomeFromShortcut("artist")).toBe(true);
    expect(shouldOpenSearchFromShortcut("search")).toBe(false);
    expect(shouldOpenSearchFromShortcut("library")).toBe(true);
  });

  it("disables audio transport shortcuts while the MV theater owns playback", () => {
    expect(canUsePlaybackShortcut("mv-theater")).toBe(false);
    expect(canUsePlaybackShortcut("detail")).toBe(true);
  });

  it("decides the Now Playing shortcut as a surface transition", () => {
    expect(nowPlayingShortcutDecision("mv-theater")).toBe("ignore");
    expect(nowPlayingShortcutDecision("np")).toBe("back");
    expect(nowPlayingShortcutDecision("detail")).toBe("open");
    expect(nowPlayingShortcutDecision("detail", false)).toBe("ignore");
  });
});
