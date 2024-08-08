import React from "react";
import {meta, player} from "./style";
import {Image, Button} from "@fluentui/react-components";
import {
    bundleIcon,
    CheckmarkCircle24Filled,
    CheckmarkCircle24Regular,
} from "@fluentui/react-icons";

const CalendarMonth = bundleIcon(CheckmarkCircle24Filled, CheckmarkCircle24Regular);

const Thumbnail: React.FC = () => {
    const classes = meta()
    return <div className={classes.thumbnail}>
        <Image
            shape={"rounded"}
            src="https://fabricweb.azureedge.net/fabric-website/assets/images/avatar/AllanMunger.jpg"
            height={56}
            width={56}/>
    </div>
}
const Info: React.FC = () => {
    const classes = meta()
    return <div className={classes.info}>
        <div className={classes.info_title}>反方向的钟</div>
        <div className={classes.info_artist}>周杰伦</div>
    </div>
}
const Meta: React.FC = () => {
    const classes = player()
    const classes2 = meta()
    return <div className={classes.meta}>
        <div className={classes2.root}>
            <Thumbnail/>
            <Info/>
            <Button appearance="transparent" shape={"circular"} icon={<CalendarMonth/>}/>
        </div>
    </div>
}
export default Meta