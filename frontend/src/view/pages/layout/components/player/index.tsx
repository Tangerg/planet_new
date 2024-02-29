import "./index.styl"
import LeftControls from "./components/left-controls";
import MiddleControls from "./components/middle-controls";
import RightControls from "./components/right-controls";
import {FC} from "react";

const Player:FC = ()=>{
    return <footer className={"player"}>
        <div className={"player-wrapper"}>
            <LeftControls/>
            <MiddleControls/>
            <RightControls/>
        </div>
    </footer>
}

export default Player