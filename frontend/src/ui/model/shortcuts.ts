export const DOUBLE_SHIFT_SEARCH_WINDOW_MS = 400;

export type ShiftSearchState = {
  lastShiftAt: number;
};

export type ShiftSearchInput = {
  key: string;
  repeat?: boolean;
  timeStamp: number;
  lastShiftAt: number;
  typing: boolean;
  alreadyInSearch: boolean;
  windowMs?: number;
};

export type ShiftSearchDecision = ShiftSearchState & {
  openSearch: boolean;
};

export const TEXT_ENTRY_SELECTOR = "input, textarea, [contenteditable='true']";
export const SPACE_HANDLED_BY_FOCUSED_CONTROL_SELECTOR =
  'button, a, input, textarea, select, [role="button"], [contenteditable="true"]';

export type NowPlayingShortcutDecision = "open" | "back" | "ignore";

export function elementMatchesClosest(el: Element | null | undefined, selector: string): boolean {
  return Boolean(el?.closest(selector));
}

export function shouldGoBackFromShortcut(view: string): boolean {
  return view !== "xmb";
}

export function shouldGoHomeFromShortcut(view: string): boolean {
  return view !== "xmb";
}

export function shouldOpenSearchFromShortcut(view: string): boolean {
  return view !== "search";
}

export function canUsePlaybackShortcut(view: string): boolean {
  return view !== "mv-theater";
}

export function nowPlayingShortcutDecision(
  view: string,
  hasCurrentTrack = true,
): NowPlayingShortcutDecision {
  if (!canUsePlaybackShortcut(view)) return "ignore";
  if (!hasCurrentTrack && view !== "np") return "ignore";
  return view === "np" ? "back" : "open";
}

export function shiftSearchDecision({
  key,
  repeat = false,
  timeStamp,
  lastShiftAt,
  typing,
  alreadyInSearch,
  windowMs = DOUBLE_SHIFT_SEARCH_WINDOW_MS,
}: ShiftSearchInput): ShiftSearchDecision {
  if (key !== "Shift") return { lastShiftAt: 0, openSearch: false };
  if (repeat || typing) return { lastShiftAt, openSearch: false };
  if (timeStamp - lastShiftAt < windowMs && !alreadyInSearch) {
    return { lastShiftAt: 0, openSearch: true };
  }
  return { lastShiftAt: timeStamp, openSearch: false };
}
