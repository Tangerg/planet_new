import React from "react";
import {action, player} from "./style";
import {
    TextBulletList24Filled,
    Speaker224Regular,
    FullScreenMaximize24Filled
} from "@fluentui/react-icons";
import {Button, Tooltip} from "@fluentui/react-components";
import Slider from "../../../components/slider";

const Queue: React.FC = () => {
    return <Tooltip
        withArrow
        appearance="inverted"
        content="Queue"
        relationship="label"
    >
        <Button appearance="transparent" shape={"circular"} icon={<TextBulletList24Filled/>}/>
    </Tooltip>
}
const Mute: React.FC = () => {
    return <Tooltip
        withArrow
        appearance="inverted"
        content="Volume"
        relationship="label"
    >
        <Button appearance="transparent" shape={"circular"} icon={<Speaker224Regular/>}/>
    </Tooltip>
}
const Volume: React.FC = () => {
    return <Slider/>
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