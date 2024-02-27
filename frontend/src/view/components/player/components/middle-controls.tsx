import {FC} from "react";
import {Slider} from "@nextui-org/react";
interface MiddleControlsProps {

}


const ProgressSlider:FC = () => {
    return <div className={"middle-controls_actions_slider"}>
        <Slider
            size={"sm"}
            step={1}
            defaultValue={0}
            maxValue={100}
            minValue={0}
            startContent={<div style={{marginRight: "2px"}}>01:23</div>}
            endContent={<div style={{marginLeft: "2px"}}>03:12</div>}
        />
    </div>
}


const MiddleControls: FC<MiddleControlsProps> = (props) => {
    return <div className={"middle-controls-wrapper"}>
        <div className={"middle-controls"}>
            <div className={"middle-controls_actions_queue"}>Controls</div>
            <ProgressSlider/>
        </div>
    </div>
}

export default MiddleControls