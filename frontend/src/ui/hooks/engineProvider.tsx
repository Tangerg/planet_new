import type { Engine } from "@core";
import React from "react";

/**
 * Provides the application Engine (the kernel facade) to the React tree. The UI
 * holds only the Engine — never the Planet, the provider, or the event bus
 * directly. Subscribe to state via `engine.events`, command via
 * `engine.playback` / `engine.media`.
 */
export const EngineContext = React.createContext<Engine | undefined>(undefined);

export type EngineProviderProps = {
  engine: Engine;
  children?: React.ReactNode;
};

export const EngineProvider: React.FC<EngineProviderProps> = ({ engine, children }) => {
  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>;
};
