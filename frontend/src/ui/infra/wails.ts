export type WailsRuntime = {
  Quit?: () => void;
  WindowMinimise?: () => void;
  WindowToggleMaximise?: () => void;
};

declare global {
  interface Window {
    go?: unknown;
    runtime?: WailsRuntime;
  }
}

export function wailsGoBridgeReady(): boolean {
  return typeof window !== "undefined" && typeof window.go === "object";
}

export function wailsRuntime(): WailsRuntime | undefined {
  return window.runtime;
}
