import { IPlanet } from "@core";
import { PlanetContext } from "./planetProvider";
import React from "react";

export const usePlanet = (planet?: IPlanet): IPlanet => {
  const ctx = React.useContext(PlanetContext);
  if (planet) {
    return planet;
  }
  if (!ctx) {
    throw new Error("No Planet set, use PlanetProvider to set one");
  }
  return ctx;
};
