import React from "react";
import {Track} from "../../../packages/model/track";


export interface Props {
    tracks: Track[]
}

const TrackList: React.FC<Props> = (props, context) => {
    const {tracks} = props
    return <div>
        {"tracks"}
    </div>
}
export default TrackList