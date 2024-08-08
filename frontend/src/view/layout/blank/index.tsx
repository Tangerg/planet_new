import {layoutStyle} from "../style"
import React from "react";

const Blank: React.FC = () => {
    const classes = layoutStyle()
    return <div className={classes.root}>

    </div>
}

export default Blank