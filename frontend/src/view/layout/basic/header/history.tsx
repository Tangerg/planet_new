import React from "react";
import {Tooltip} from "@fluentui/react-components";
import {ChevronCircleLeft32Filled, ChevronCircleRight32Filled} from "@fluentui/react-icons";
import {hearderContent} from "./style";

const History: React.FC = () => {
    const classes = hearderContent()
    const goBack = () => {
        window.history.back()
    }
    const goForward = () => {
        window.history.forward()
    }
    return <div className={classes.history}>
        <Tooltip
            withArrow
            appearance="inverted"
            content="Go back"
            relationship="label"
        >
            <ChevronCircleLeft32Filled onClick={goBack}/>
        </Tooltip>
        <Tooltip
            withArrow
            content="Go forward"
            relationship="label"
        >
            <ChevronCircleRight32Filled onClick={goForward}/>
        </Tooltip>
    </div>
}

export default History