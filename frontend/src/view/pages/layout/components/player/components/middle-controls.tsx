import {FC} from "react";
import {Slider} from "@nextui-org/react";
import classnames from "classnames"
import {Entertainment, GoEnd, GoStart, MenuUnfold, MicrophoneOne, Play, PlayOnce} from "@icon-park/react";

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


const PlayPause: FC = () => {
    return <button className={"action-btn"}>
        <Play theme="filled" size={40} fill="#4a90e2"  strokeWidth={4} strokeLinejoin="miter" strokeLinecap="butt"/>
    </button>
}


const QueuePrevious: FC = (props) => {
    return <button className={"action-btn"}>
        <GoStart theme="filled" size={25} fill="#4a90e2"  strokeWidth={3} strokeLinejoin="miter" strokeLinecap="butt"/>
    </button>
}
const QueueNext: FC = (props) => {
    return <button className={"action-btn"}>
        <GoEnd theme="filled" size={25} fill="#4a90e2"  strokeWidth={3} strokeLinejoin="miter" strokeLinecap="butt"/>
    </button>
}
const PlayMode: FC = () => {
    return <button className={"action-btn"}>
        <PlayOnce theme="filled" size={25} fill="#4a90e2"  strokeWidth={3} strokeLinejoin="miter" strokeLinecap="butt"/>
    </button>
}
const Lyric: FC = () => {
    return <button className={"action-btn"}>
        <Entertainment theme="filled" size={25} fill="#4a90e2"  strokeWidth={3} strokeLinejoin="miter" strokeLinecap="butt"/>
    </button>
}
const Actions: FC = () => {
    return <div className={"middle-controls_actions"}>
        <PlayMode/>
        <QueuePrevious/>
        <PlayPause/>
        <QueueNext/>
        <Lyric/>
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
