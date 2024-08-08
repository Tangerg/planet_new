import React from "react";
import Meta from "./meta";
import Control from "./control";
import Action from "./action";
import {player} from "./style"

const Player: React.FC = () => {
    const classes = player()
    return <footer className={classes.root}>
        <Meta/>
        <Control/>
        <Action/>
    </footer>
}
export default Player