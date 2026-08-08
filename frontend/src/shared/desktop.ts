/**
 * Host-environment predicate: is this document running inside the native desktop
 * shell (a Wails webview), or in a plain browser tab / jsdom?
 *
 * Framework-agnostic on purpose — it reads the host's globals rather than
 * importing the Wails runtime, so it stays usable from the innermost layer that
 * both the `local` provider and the UI's shell adapters can reach.
 */

type WebviewHost = {
  /** Injected by Go once the webview finishes navigating. */
  _wails?: { environment?: { OS?: string } };
  /** WebView2 (Windows). */
  chrome?: { webview?: unknown };
  /** WKWebView (macOS) and WebKitGTK (Linux). */
  webkit?: { messageHandlers?: { external?: unknown } };
};

const DESKTOP_PLATFORMS = new Set(["darwin", "windows", "linux"]);

/**
 * True when a Go backend is reachable behind this page.
 *
 * Two signals are needed, because neither covers the whole run on its own:
 *
 *  - The runtime config (`_wails.environment`) is the authoritative answer, but
 *    Go injects it only after the webview finishes navigating — i.e. *after* the
 *    app's first render — so it cannot gate the queries that fire on mount.
 *  - The platform IPC handle is installed on the webview's configuration before
 *    the document loads, so it is the reliable signal during that early window.
 *    It is absent in a browser, which is exactly the case we want to detect.
 *
 * The handle only proves "some native webview", not "a desktop one" — a mobile
 * webview would read as true until the config lands and corrects it. That gap is
 * unreachable here: the app ships desktop-only (see the build targets), and the
 * fallback exists precisely for the window where nothing better is knowable.
 */
export function isDesktopShell(): boolean {
  if (typeof window === "undefined") return false;
  const host = window as WebviewHost;
  const platform = host._wails?.environment?.OS;
  if (platform !== undefined) return DESKTOP_PLATFORMS.has(platform);
  return Boolean(host.chrome?.webview ?? host.webkit?.messageHandlers?.external);
}
