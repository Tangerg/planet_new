import { createContext, useContext } from "react";

type MenuEvent = React.MouseEvent | MouseEvent;

/**
 * Imperative screen-level actions that deeply-nested cards/rows trigger without
 * prop-drilling: open a track/collection context menu, or enqueue a track.
 * Replaces the former `window.__TRACKMENU / __COLLMENU / __ENQUEUE` globals with
 * a typed React context (provided by the Shell, fed from useContextMenu).
 */
export type ScreenActions = {
  trackMenu: (e: MenuEvent, track: any) => void;
  collMenu: (e: MenuEvent, item: any) => void;
  /** Add a track to the play queue (no-op until the queue write path lands). */
  enqueue: (trackId: string, next?: boolean) => void;
};

// Safe defaults so a consumer outside the provider is a quiet no-op, never a crash.
const noop: ScreenActions = {
  trackMenu: () => {},
  collMenu: () => {},
  enqueue: () => {},
};

const ScreenActionsContext = createContext<ScreenActions>(noop);

export function ScreenActionsProvider({
  actions,
  children,
}: {
  actions: ScreenActions;
  children: React.ReactNode;
}) {
  return <ScreenActionsContext.Provider value={actions}>{children}</ScreenActionsContext.Provider>;
}

/** Read screen actions inside any card/row (no prop-drilling, no globals). */
export function useScreenActions(): ScreenActions {
  return useContext(ScreenActionsContext);
}
