import {FC} from "react";
import classnames from "classnames";
import {MusicList, MusicRhythm, VolumeNotice} from "@icon-park/react";
import {Slider} from "@nextui-org/react";
interface RightControlsProps {

}

const Volume:FC = ()=>{
    return <div style={{width:"100px"}}>
        <Slider
            size={"sm"}
            step={1}
            defaultValue={0}
            maxValue={100}
            minValue={0}
            startContent={
            <VolumeNotice theme="filled" size={20} fill="#4a90e2"  strokeWidth={3} strokeLinejoin="miter" strokeLinecap="butt"/>
            }
        />
    </div>
}

const Rhythm:FC = ()=>{
    return <button>
        <MusicRhythm theme="filled" size={20} fill="#4a90e2"  strokeWidth={3} strokeLinejoin="miter" strokeLinecap="butt"/>
    </button>
}
const PlayList:FC = ()=>{
    return <button>
        <MusicList theme="filled" size={20} fill="#4a90e2"  strokeWidth={3} strokeLinejoin="miter" strokeLinecap="butt"/>
    </button>
}

const RightControls:FC<RightControlsProps> = (props)=>{
    return <div className={"right-controls-wrapper"}>
        <div className={classnames("right-controls")}>
            <Volume/>
            <Rhythm/>
            <PlayList/>
        </div>
    </div>
}
export default RightControls