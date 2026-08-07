import { Application, Window } from "@wailsio/runtime";

import { isDesktopShell } from "@shared/desktop";

/**
 * Window-chrome actions for the frameless shell. Wails v3 exposes them as runtime
 * methods instead of the `window.runtime` global v2 injected, so this module is
 * the UI's one place that talks to the desktop runtime: the same views also run
 * in a plain `vite dev` tab, where every action must degrade to a no-op.
 */

/** Re-exported so shell components need only one desktop-shell import. */
export { isDesktopShell };

/** Quit the application (the faux red traffic light). */
export function quitApp(): void {
  if (isDesktopShell()) void Application.Quit();
}

/** Minimise the current window (the faux yellow traffic light). */
export function minimiseWindow(): void {
  if (isDesktopShell()) void Window.Minimise();
}

/** Maximise/restore the current window (the faux green traffic light). */
export function toggleMaximiseWindow(): void {
  if (isDesktopShell()) void Window.ToggleMaximise();
}
