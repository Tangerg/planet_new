import type React from "react";

import { useEventCallback } from "@/hooks/useEventCallback";
import { appMenuItems, type AppMenuBindings, type MenuState } from "@/model/menu";

type SetMenu = (state: MenuState) => void;

/**
 * Open the app menu anchored under the button that was clicked.
 *
 * The bindings travel through as one contract (`AppMenuBindings`) rather than
 * nine parameters re-listed here and re-assembled below. Identity is stable for
 * the life of the shell: a menu opener is only ever invoked from a click, so it
 * reads the freshest bindings at that moment instead of being rebuilt — and a
 * new handler on every navigation (`canGoBack` flips constantly) would push a
 * fresh prop into the window chrome for nothing.
 */
export function useAppMenu(opts: AppMenuBindings & { setMenu: SetMenu }) {
  return useEventCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    opts.setMenu({ x: r.right, y: r.bottom + 8, items: appMenuItems(opts) });
  });
}
