import { createContext, use } from "react";

import type { CardItem, VibeTrack } from "@/model/vibe";

type MenuEvent = React.MouseEvent | MouseEvent;
type TrackMenuOptions = {
  onPlay?: (track: VibeTrack) => void;
};

export type ScreenActions = {
  trackMenu: (e: MenuEvent, track: VibeTrack, options?: TrackMenuOptions) => void;
  collMenu: (e: MenuEvent, item: CardItem) => void;
  enqueue: (trackId: string, next?: boolean) => void;
};

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

export function useScreenActions(): ScreenActions {
  return use(ScreenActionsContext);
}
