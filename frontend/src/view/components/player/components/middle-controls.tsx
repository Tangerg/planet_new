import {FC} from "react";
import {Slider} from "@nextui-org/react";
import classnames from "classnames"

interface MiddleControlsProps {

}

interface TimeProps {
    position: "left" | "right"
    time: string
}

const Time: FC<TimeProps> = (props) => {
    const {time, position} = props
    const cls = "middle-controls_progress-slider-time-" + position
    return <div className={classnames("middle-controls_progress-slider-time", cls)}>
        {time}
    </div>
}
const ProgressSlider: FC = () => {
    return <div className={"middle-controls_progress-slider"}>
        <Slider
            size={"sm"}
            step={1}
            defaultValue={0}
            maxValue={100}
            minValue={0}
            startContent={<Time time={"01:03"} position={"left"}/>}
            endContent={<Time time={"03:22"} position={"right"}/>}
        />
    </div>
}


const ActionPlayPause: FC = () => {
    return <div>PlayPause</div>
}

interface ActionQueueProps {
    type: "previous" | "next"
}

const ActionQueue: FC<ActionQueueProps> = (props) => {
    const {type} = props
    return <div>
        {type}
    </div>
}
const ActionPlayMode: FC = () => {
    return <div>
        PlayMode
    </div>
}
const Actions: FC = () => {
    return <div className={"middle-controls_actions"}>
        <ActionPlayMode/>
        <ActionQueue type={"previous"}/>
        <ActionPlayPause/>
        <ActionQueue type={"next"}/>
        <ActionPlayMode/>
    </div>
}

const MiddleControls: FC<MiddleControlsProps> = (props) => {
    return <div className={"middle-controls-wrapper"}>
        <div className={"middle-controls"}>
            <Actions/>
            <ProgressSlider/>
        </div>
    </div>
}

export default MiddleControls
