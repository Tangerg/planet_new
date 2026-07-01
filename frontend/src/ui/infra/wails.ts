export type WailsRuntime = {
  Quit?: () => void;
  WindowMinimise?: () => void;
  WindowToggleMaximise?: () => void;
};

declare global {
  interface Window {
    runtime?: WailsRuntime;
  }
}

export function wailsRuntime(): WailsRuntime | undefined {
  return window.runtime;
}
