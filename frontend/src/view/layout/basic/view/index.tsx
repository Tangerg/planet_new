import React, {useEffect} from "react";
import TrackList from "../../../components/track-list";
import Banner from "../../../components/banner";
import CardFlow from "../../../components/card-flow";
import Title from "../../../components/title";
import {makeStyles} from "@fluentui/react-components";
import {Outlet} from "@tanstack/react-router";

const view = makeStyles({
    root: {
        position: "relative",
        flex: 1,
        minHeight: 0,
        overflowY: "scroll",
    }
})
const View: React.FC = () => {
    const classes = view()
    return <div className={classes.root}>
        {/*<Banner/>*/}
        {/*<TrackList></TrackList>*/}
        {/*<Title/>*/}
        {/*<CardFlow/>*/}
        <Outlet/>
    </div>
}
export default View