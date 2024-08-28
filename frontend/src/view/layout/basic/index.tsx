import React from "react";
import {layoutStyle} from "../style";
import Player from "./player"
import Nav from "./nav";
import Header from "./header";
import View from "./view";
import {basic} from "./style";
import Queue from "./queue";


const Basic: React.FC = () => {
    const classes = layoutStyle()
    const classes2 = basic()
    return <main className={classes.root}>
        <div className={classes2.root}>
            <aside className={classes2.nav}>
                <Nav/>
            </aside>
            <div className={classes2.view}>
                <Header/>
                <View/>
            </div>
            <footer className={classes2.footer}>
                <Player/>
            </footer>
            <div>
                <Queue/>
            </div>
        </div>
    </main>
}

export default Basic