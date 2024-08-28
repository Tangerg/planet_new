import React from "react";
import {header, hearderContent} from "./style";
import History from "./history";
import Profile from "./profile";

const Mask: React.FC = () => {
    const classes = header()
    return <div className={classes.mask}>
        <div className={classes.mask_inner}></div>
    </div>
}
const Content: React.FC = () => {
    const classes = hearderContent()
    return <div className={classes.root}>
        <History/>
        <div className={classes.slot}></div>
        <Profile/>
    </div>
}
const Header: React.FC = () => {
    const classes = header()
    return <header className={classes.root}>
        <Mask/>
        <Content/>
    </header>
}
export default Header