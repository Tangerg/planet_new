import React from "react";
import {Track} from "../../../packages/model/track";
import {Image, makeStyles} from "@fluentui/react-components";
import {formatDuration, Minute, Second} from "../../../packages/shared-utils/time";

const styles = makeStyles({
    root: {
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gridAutoRows: "auto 1fr auto",
        gap: "8px",
        boxSizing: "border-box",
        position: "relative",
        borderRadius: "6px",
        minBlockSize: "56px",
        padding: "8px",
        cursor: "pointer",
    },
    mask: {
        position: "absolute",
        inset: "0px",
        cursor: "pointer",
        backgroundColor: "transparent",
        border: "none",
        width: "100%",
    },
    thumbnail: {
        gridColumn: "1"
    },
    thumbnail_img: {
        display: "flex",
        alignItems: "center",
        height: "100%",
        gap: "12px"
    },
    meta: {
        gridColumnEnd: "-1",
        gap: "12px",
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between"
    },
    meta_title: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        alignItems: "flex-start",
    },
    title_primary: {
        fontWeight: 400,
        fontsize: "16px",
    },
    title_secondary: {
        fontWeight: 400,
        fontsize: "14px",
    },
    meta_duration: {
        flexShrink: 0,
        alignSelf: "stretch",
        display: "flex",
        alignItems: "center",
    },
    duration: {
        alignItems: "center",
        marginInlineEnd: "8px",
        display: "flex",
        gap: "16px"
    }
})
type TrackItemProps = {
    track: Track;
    onClick?: (track: Track) => void;
}
const TrackItem: React.FC<TrackItemProps> = (props) => {
    const classes = styles()
    const {track, onClick} = props;
    return <div className={classes.root}>
        <div className={classes.mask}/>
        <div className={classes.thumbnail}>
            <div className={classes.thumbnail_img}>
                <Image shape={"rounded"} src={track.album?.image}/>
            </div>
        </div>
        <div className={classes.meta}>
            <div className={classes.meta_title}>
                <p className={classes.title_primary}>{track.name}</p>
                <p className={classes.title_secondary}>{track.artists![0].name}</p>
            </div>
            <div className={classes.meta_duration}>
                <div className={classes.duration}>
                    {formatDuration(track.duration, [Minute, Second])}
                </div>
            </div>
        </div>
    </div>
}

export default TrackItem