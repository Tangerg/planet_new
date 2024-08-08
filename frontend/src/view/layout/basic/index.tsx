import React from "react";
import {layoutStyle} from "../style";
import Player from "./player"

const Basic: React.FC = () => {
    const classes = layoutStyle()
    return <main className={classes.root}>
        <Player/>
    </main>
}

export default Basic