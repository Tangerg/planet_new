import React from "react";
import Meta from "./meta";
import Control from "./control";
import Action from "./action";
import {player} from "./style"

const Player: React.FC = () => {
    const classes = player()
    return <div className={classes.root}>
        <div className={classes.container}>
            <Meta/>
            <Control/>
            <Action/>
        </div>
    </div>
}
export default Player