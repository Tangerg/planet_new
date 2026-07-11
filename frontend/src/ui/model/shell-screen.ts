import type { DetailTarget, VibeMusicVideo } from "./vibe";

export const SHELL_SCREEN_VIEWS = [
  "xmb",
  "home",
  "search",
  "music-videos",
  "mv-detail",
  "mv-theater",
  "charts",
  "library",
  "detail",
  "queue",
  "history",
  "settings",
  "artist",
  "profile",
  "comments",
  "np",
  "stage",
] as const;

export type ShellScreenView = (typeof SHELL_SCREEN_VIEWS)[number];
type DataBackedView = "detail" | "mv-detail" | "mv-theater";
type StaticView = Exclude<ShellScreenView, DataBackedView>;
type StaticRoute = { [View in StaticView]: Readonly<{ kind: View }> }[StaticView];

export type ShellScreenRoute =
  | StaticRoute
  | Readonly<{ kind: "detail"; detail: DetailTarget }>
  | Readonly<{ kind: "mv-detail"; video: VibeMusicVideo }>
  | Readonly<{ kind: "mv-theater"; video: VibeMusicVideo }>;

function isShellScreenView(view: string): view is ShellScreenView {
  return SHELL_SCREEN_VIEWS.some((candidate) => candidate === view);
}

/**
 * Resolve an untrusted navigation string into a renderable screen. Data-backed
 * screens remain unavailable until their navigation payload exists, preserving
 * the resident shell's existing skeleton/fallback behavior.
 */
export function resolveShellScreen(
  view: string,
  detail: DetailTarget | null,
  musicVideo: VibeMusicVideo | null,
): ShellScreenRoute | null {
  if (!isShellScreenView(view)) return null;
  if (view === "detail") return detail ? { kind: view, detail } : null;
  if (view === "mv-detail" || view === "mv-theater") {
    return musicVideo ? { kind: view, video: musicVideo } : null;
  }
  return { kind: view };
}
