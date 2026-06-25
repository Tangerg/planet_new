import React from "react";
import type { Engine } from "@core";
import { EngineContext } from "./engineProvider";

/** The application Engine from context — the UI's single handle to the kernel. */
export function useEngine(): Engine {
  const engine = React.useContext(EngineContext);
  if (!engine) {
    throw new Error("No Engine set; wrap the app in <EngineProvider engine={…}>.");
  }
  return engine;
}
