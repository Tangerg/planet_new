import {FC} from "react";
import "./index.styl"
import TrackList from "../../../../components/track-list/list";
import Slider from "../../../../components/slider";

const Content: FC = () => {
    return <div className={"content"}>
        <TrackList tracks={[]}/>
        <Slider
            size={"medium"}
            onChange={(_, val) => {
                console.log(val)
            }}
            onChangeComplete={(val) => {
                console.log("complete")
                console.log(val)
            }}
        />
    </div>
}
export default Content