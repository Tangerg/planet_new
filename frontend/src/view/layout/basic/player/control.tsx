import React, {JSX, useEffect, useState} from "react";
import type {Duration, Progress} from "../../../../packages/model/duration";
import {control, player} from "./style";
import {
    ArrowRepeat124Filled,
    ArrowRepeatAll24Filled,
    ArrowRepeatAllOff24Filled,
    ArrowShuffle24Filled,
    Next24Filled,
    PauseCircle24Filled,
    PlayCircle24Filled,
    Previous24Filled,
    ArrowShuffleOff24Filled
} from "@fluentui/react-icons";
import Slider from "../../../components/slider";
import {Button, Tooltip} from "@fluentui/react-components";
import {usePlanet} from "../../../hooks/usePlanet";
import {RepeatMode} from "../../../../packages/plugin/playqueue/repeat";
import {PlayState} from "../../../../packages/plugin";


const Shuffle: React.FC = () => {
    const [shuffleEnabled, setShuffleEnabled] = React.useState<boolean>(false);
    const planet = usePlanet();
    useEffect(() => {
        planet.hooks.on("shuffle_enable_changed", setShuffleEnabled)
        return () => {
            planet.hooks.off("shuffle_enable_changed", setShuffleEnabled)
        }
    }, [])
    const toolTipText = (): string => {
        if (shuffleEnabled) {
            return "Shuffle Enabled";
        }
        return "Shuffle Disabled";
    }
    const renderShuffleIcon = (): JSX.Element => {
        if (shuffleEnabled) {
            return <ArrowShuffle24Filled/>
        }
        return <ArrowShuffleOff24Filled/>
    }
    return <Tooltip
        withArrow
        appearance="inverted"
        content={toolTipText()}
        relationship="label"
    >
        <Button onClick={() => {
            planet.hooks.emit("change_shuffle_enable")
        }} appearance="transparent" shape={"circular"} icon={renderShuffleIcon()}/>
    </Tooltip>
}
const Previous: React.FC = () => {
    const planet = usePlanet();
    return <Tooltip
        withArrow
        appearance="inverted"
        content="Previous"
        relationship="label"
    >
        <Button onClick={() => {
            planet.hooks.emit("previous_track")
        }} appearance="transparent" shape={"circular"} icon={<Previous24Filled/>}/>
    </Tooltip>
}
const PlayPause: React.FC = () => {
    const [playState, setPlayState] = useState<PlayState>(PlayState.STOPED)
    const planet = usePlanet()
    useEffect(() => {
        planet.hooks.on("play_state_changed", setPlayState)
        return () => {
            planet.hooks.off("play_state_changed", setPlayState)
        }
    }, [])
    const tooltipText = (): string => {
        switch (playState) {
            case PlayState.PLAYING:
                return "Pause"
            case PlayState.PAUSED:
                return "Play"
            case PlayState.STOPED:
                return "Stoped"
        }
    }
    const renderPlayIcon = (): JSX.Element => {
        switch (playState) {
            case PlayState.PLAYING:
                return <PauseCircle24Filled/>
            case PlayState.PAUSED:
                return <PlayCircle24Filled/>
            case PlayState.STOPED:
                return <PlayCircle24Filled/>
        }
    }
    const onClick = () => {
        if (playState === PlayState.STOPED) {
            planet.hooks.emit("play")
        } else if (playState === PlayState.PLAYING) {
            planet.hooks.emit("pause")
        } else {
            planet.hooks.emit("play")
        }
    }
    return <Tooltip
        withArrow
        appearance="inverted"
        content={tooltipText()}
        relationship="label"
    >
        <Button onClick={onClick} appearance="transparent" size={"large"} shape={"circular"} icon={renderPlayIcon()}/>
    </Tooltip>
}
const Next: React.FC = () => {
    const planet = usePlanet();
    return <Tooltip
        withArrow
        appearance="inverted"
        content="Next"
        relationship="label"
    >
        <Button onClick={() => {
            planet.hooks.emit("next_track")
        }} appearance="transparent" shape={"circular"} icon={<Next24Filled/>}/>
    </Tooltip>
}
const Repeat: React.FC = () => {
    const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.OFF)
    const planet = usePlanet()
    useEffect(() => {
        planet.hooks.on("repeat_mode_changed", setRepeatMode)
        return () => {
            planet.hooks.off("repeat_mode_changed", setRepeatMode)
        }
    }, [])
    const toolTipText = (): string => {
        switch (repeatMode) {
            case RepeatMode.OFF:
                return "Repeat off"
            case RepeatMode.ONE:
                return "Repeat one"
            case RepeatMode.ALL:
                return "Repeat all"
        }
    }
    const renderRepeatIcon = (): JSX.Element => {
        switch (repeatMode) {
            case RepeatMode.OFF:
                return <ArrowRepeatAllOff24Filled/>
            case RepeatMode.ONE:
                return <ArrowRepeat124Filled/>
            case RepeatMode.ALL:
                return <ArrowRepeatAll24Filled/>
        }
    }
    return <Tooltip
        withArrow
        appearance="inverted"
        content={toolTipText()}
        relationship="label"
    >
        <Button onClick={() => {
            planet.hooks.emit("change_repeat_mode")
        }} appearance="transparent" shape={"circular"} icon={renderRepeatIcon()}/>
    </Tooltip>
}
const Actions: React.FC = () => {
    const classes2 = control()
    return <div className={classes2.actions}>
        <div className={classes2.action_left}>
            <Shuffle/>
            <Previous/>
        </div>
        <PlayPause/>
        <div className={classes2.action_right}>
            <Next/>
            <Repeat/>
        </div>

    </div>
}

type DurationProps = {
    duration: Duration
}
const Duration: React.FC<DurationProps> = ({duration}) => {
    const classes2 = control()
    return <div className={classes2.progress_duration}>
        {duration.durationFormatted}
    </div>
}

const Progress: React.FC = () => {
    const [progress, setProgress] = useState<Progress>({
        duration: 0,
        durationFormatted: "00:00",
        percent: 0
    })
    const [duration, setDuration] = useState<Duration>({
        duration: 0,
        durationFormatted: "00:00"
    })
    const classes2 = control()
    const planet = usePlanet()
    useEffect(() => {
        planet.hooks.on("track_duration_changed", setDuration)
        planet.hooks.on("play_time_changed", setProgress)
        return () => {
            planet.hooks.off("track_duration_changed", setDuration)
            planet.hooks.off("play_time_changed", setProgress)
        }
    })
    return <div className={classes2.progress}>
        <Duration duration={progress}/>
        <Slider value={progress.percent} onChange={(_, data) => {
            planet.hooks.emit("play_time_seek", data.value)
        }}/>
        <Duration duration={duration}/>
    </div>
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