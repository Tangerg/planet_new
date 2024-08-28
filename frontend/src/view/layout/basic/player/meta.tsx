import React, {useEffect, useState} from "react";
import {meta, player} from "./style";
import {Image, Button} from "@fluentui/react-components";
import {
    bundleIcon,
    CheckmarkCircle24Filled,
    CheckmarkCircle24Regular,
} from "@fluentui/react-icons";
import {usePlanet} from "../../../hooks/usePlanet";
import {Track} from "../../../../packages/model/track";

const CalendarMonth = bundleIcon(CheckmarkCircle24Filled, CheckmarkCircle24Regular);

type Props = {
    track: Partial<Track>;
}
const Thumbnail: React.FC<Props> = ({track}) => {
    const classes = meta()
    return <div className={classes.thumbnail}>
        <Image
            shape={"rounded"}
            src={track.album?.image}
            height={56}
            width={56}/>
    </div>
}

const Info: React.FC<Props> = ({track}) => {
    const classes = meta()
    return <div className={classes.info}>
        <div className={classes.info_title}>{track.name}</div>
        <div className={classes.info_artist}>{track.artists![0].name}</div>
    </div>
}
const Meta: React.FC = () => {
    const [track, setTrack] = useState<Partial<Track>>({
        name: "Planet",
        artists: [{name: ""}],
        album: {
            image: ""
        }
    })
    const classes = player()
    const classes2 = meta()
    const planet = usePlanet()
    useEffect(() => {
        planet.hooks.on("current_track_changed", setTrack)
        return () => {
            planet.hooks.off("current_track_changed", setTrack)
        }
    }, [])
    return <div className={classes.meta}>
        <div className={classes2.root}>
            <Thumbnail track={track}/>
            <Info track={track}/>
            <Button appearance="transparent" shape={"circular"} icon={<CalendarMonth/>}/>
        </div>
    </div>
}
export default Meta