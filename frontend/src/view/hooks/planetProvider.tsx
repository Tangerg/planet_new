import {IPlanet} from "../../packages/core";
import React from "react";

export const PlanetContext = React.createContext<IPlanet | undefined>(undefined)

export type PlanetProviderProps = {
    planet: IPlanet;
    children?: React.ReactNode;
}


export const PlanetProvider: React.FC<PlanetProviderProps> = (props: PlanetProviderProps) => {
    const {planet, children} = props
    return <PlanetContext.Provider value={planet}>
        {children}
    </PlanetContext.Provider>;
}