import {useEffect, useState} from "react";
import {usePlanet} from "./usePlanet";

export const useVolume = () => {
    const [volume, setVolume] = useState<number>(0);
    const planet = usePlanet();
    useEffect(() => {
        planet.hooks.on("volume_changed", setVolume)
        return () => {
            planet.hooks.off("volume_changed", setVolume)
        }
    }, [])
    return [volume];
}