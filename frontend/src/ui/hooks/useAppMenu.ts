import type React from "react";

import { useEventCallback } from "@/hooks/useEventCallback";
import { appMenuItems, type AppMenuBindings, type MenuState } from "@/model/menu";

type SetMenu = (state: MenuState) => void;

export function useAppMenu(opts: AppMenuBindings & { setMenu: SetMenu }) {
  return useEventCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    opts.setMenu({ x: r.right, y: r.bottom + 8, items: appMenuItems(opts) });
  });
}
