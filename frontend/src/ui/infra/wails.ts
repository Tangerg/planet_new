import { Window } from "@wailsio/runtime";

import { isDesktopShell } from "@shared/desktop";

export function closeWindow(): void {
  if (isDesktopShell()) void Window.Close();
}

export function minimiseWindow(): void {
  if (isDesktopShell()) void Window.Minimise();
}

export function toggleMaximiseWindow(): void {
  if (isDesktopShell()) void Window.ToggleMaximise();
}
