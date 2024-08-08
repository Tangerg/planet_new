import React from "react";
import {control, player} from "./style";
import {
    ArrowShuffle24Filled,
    ArrowRepeatAll24Filled,
    PlayCircle48Filled,
    Previous24Filled,
    Next24Filled
} from "@fluentui/react-icons";
import Slider from "../../../components/slider";
import {Button, Tooltip} from "@fluentui/react-components";


const Shuffle: React.FC = () => {
    return <Tooltip
        withArrow
        appearance="inverted"
        content="Shuffle"
        relationship="label"
    >
        <Button appearance="transparent" shape={"circular"} icon={<ArrowShuffle24Filled/>}/>
    </Tooltip>
}
const Previous: React.FC = () => {
    return <Tooltip
        withArrow
        appearance="inverted"
        content="Previous"
        relationship="label"
    >
        <Button appearance="transparent" shape={"circular"} icon={<Previous24Filled/>}/>
    </Tooltip>
}
const PlayPause: React.FC = () => {
    return <Tooltip
        withArrow
        appearance="inverted"
        content="Play"
        relationship="label"
    >
        <Button appearance="transparent" shape={"circular"} icon={<PlayCircle48Filled/>}/>
    </Tooltip>
}
const Next: React.FC = () => {
    return <Tooltip
        withArrow
        appearance="inverted"
        content="Next"
        relationship="label"
    >
        <Button appearance="transparent" shape={"circular"} icon={<Next24Filled/>}/>
    </Tooltip>
}
const Repeat: React.FC = () => {
    return <Tooltip
        withArrow
        appearance="inverted"
        content="Repeat"
        relationship="label"
    >
        <Button appearance="transparent" shape={"circular"} icon={<ArrowRepeatAll24Filled/>}/>
    </Tooltip>
}
const Actions: React.FC = () => {
    return <div>
        <Shuffle/>
        <Previous/>
        <PlayPause/>
        <Next/>
        <Repeat/>
    </div>
}
const Progress: React.FC = () => {
    return <Slider/>
}

const Control: React.FC = () => {
    const classes = player()
    const classes2 = control()
    return <div className={classes.control}>
        <div className={classes2.root}>
            <Actions/>
            <Progress/>
        </div>
    </div>
}
export default Control