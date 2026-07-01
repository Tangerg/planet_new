import { useCallback } from "react";
import type React from "react";

import { appMenuItems, type MenuState } from "@/model/menu";

type SetMenu = (state: MenuState) => void;

export function useAppMenu(opts: {
  setMenu: SetMenu;
  canGoBack: boolean;
  hasQueue: boolean;
  goBack: () => void;
  goHome: () => void;
  openSearch: () => void;
  openLibrary: () => void;
  openQueue: () => void;
  openProfile: () => void;
  openSettings: () => void;
}) {
  const {
    setMenu,
    canGoBack,
    hasQueue,
    goBack,
    goHome,
    openSearch,
    openLibrary,
    openQueue,
    openProfile,
    openSettings,
  } = opts;
  return useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      setMenu({
        x: r.right,
        y: r.bottom + 8,
        items: appMenuItems({
          canGoBack,
          hasQueue,
          goBack,
          goHome,
          openSearch,
          openLibrary,
          openQueue,
          openProfile,
          openSettings,
        }),
      });
    },
    [
      canGoBack,
      goBack,
      goHome,
      hasQueue,
      openLibrary,
      openProfile,
      openQueue,
      openSearch,
      openSettings,
      setMenu,
    ],
  );
}
