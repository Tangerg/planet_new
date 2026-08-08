import { Window } from "@wailsio/runtime";

import { isDesktopShell } from "@shared/desktop";

/**
 * Window-chrome actions for the frameless shell. Wails v3 exposes them as runtime
 * methods instead of the `window.runtime` global v2 injected, so this module is
 * the UI's one place that talks to the desktop runtime.
 *
 * Each action is gated on the host being the desktop shell: the same views also
 * run in a plain `vite dev` tab, where the runtime's HTTP transport would reject
 * and leave an unhandled rejection behind rather than simply doing nothing.
 */

/**
 * Close the current window (the faux red traffic light).
 *
 * Window-scoped, not `Application.Quit()`: a window control should act on its
 * own window. It still ends the app today because this is the only window and
 * every platform quits when the last one closes — but the day a second window
 * exists, quitting the whole app from one window's close button would be wrong.
 */
export function closeWindow(): void {
  if (isDesktopShell()) void Window.Close();
}

/** Minimise the current window (the faux yellow traffic light). */
export function minimiseWindow(): void {
  if (isDesktopShell()) void Window.Minimise();
}

/** Maximise/restore the current window (the faux green traffic light). */
export function toggleMaximiseWindow(): void {
  if (isDesktopShell()) void Window.ToggleMaximise();
}
