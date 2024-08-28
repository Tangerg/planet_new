import React, {JSX} from "react";
import {action, player} from "./style";
import {
    TextBulletList24Filled,
    Speaker224Regular,
    Speaker124Regular,
    Speaker024Regular,
    SpeakerMute24Regular,
    FullScreenMaximize24Filled
} from "@fluentui/react-icons";
import {Button, Tooltip} from "@fluentui/react-components";
import Slider from "../../../components/slider";
import {usePlanet} from "../../../hooks/usePlanet";
import {useVolume} from "../../../hooks/useVolume";
import {SliderOnChangeData} from "@fluentui/react-slider";
import useAppStore from "../../../store/app";

const Queue: React.FC = () => {
    const isQueueOpen = useAppStore.use.isQueueOpen()
    const setIsQueueOpen = useAppStore.use.setIsQueueOpen()
    return <Tooltip
        withArrow
        appearance="inverted"
        content="Queue"
        relationship="label"
    >
        <Button onClick={()=>{
            setIsQueueOpen(!isQueueOpen);
        }} appearance="transparent" shape={"circular"} icon={<TextBulletList24Filled/>}/>
    </Tooltip>
}
const Mute: React.FC = () => {
    const planet = usePlanet()
    const [volume] = useVolume()

    const tooltipText = (): string => {
        if (volume === 0) {
            return "Unmute"
        } else {
            return "Mute"
        }
    }
    const renderButtonIcon = (): JSX.Element => {
        if (volume === 0) {
            return <SpeakerMute24Regular/>
        } else if (volume < 10) {
            return <Speaker024Regular/>
        } else if (volume < 60) {
            return <Speaker124Regular/>
        } else {
            return <Speaker224Regular/>
        }
    }

    const onClick = () => {
        planet.hooks.emit("mute_or_unmute")
    }

    return <Tooltip
        withArrow
        appearance="inverted"
        content={tooltipText()}
        relationship="label"
    >
        <Button appearance="transparent" shape={"circular"} icon={renderButtonIcon()} onClick={onClick}/>
    </Tooltip>
}
const Volume: React.FC = () => {
    const planet = usePlanet()
    const [volume] = useVolume()
    //@ts-ignore
    const changeVolume = (_, data: SliderOnChangeData) => {
        planet.hooks.emit("change_volume", data.value)
    }
    return <Slider value={volume} min={0} max={100} onChange={changeVolume} type={"volume"}/>
}
const FullScreen: React.FC = () => {
    return <Tooltip
        withArrow
        appearance="inverted"
        content="FullScreen"
        relationship="label"
    >
        <Button appearance="transparent" shape={"circular"} icon={<FullScreenMaximize24Filled/>}/>
    </Tooltip>
}
const Action: React.FC = () => {
    const classes = player()
    const classes2 = action()

    return <div className={classes.action}>
        <div className={classes2.root}>
            <Queue/>
            <Mute/>
            <Volume/>
            <FullScreen/>
        </div>
    </div>
}
export default Action