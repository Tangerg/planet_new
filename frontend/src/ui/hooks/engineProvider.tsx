import type { Engine } from "@core";
import React from "react";

export const EngineContext = React.createContext<Engine | undefined>(undefined);

export type EngineProviderProps = {
  engine: Engine;
  children?: React.ReactNode;
};

export const EngineProvider: React.FC<EngineProviderProps> = ({ engine, children }) => {
  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>;
};
