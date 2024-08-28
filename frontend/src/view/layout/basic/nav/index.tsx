import {DrawerProps} from "@fluentui/react-components";
import * as React from "react";
import {
    NavDrawer,
    NavDrawerBody,
    NavDrawerHeader,
    NavItem,
    NavSectionHeader,
} from "@fluentui/react-nav-preview";

import {
    makeStyles,
} from "@fluentui/react-components";
import {
    Home20Filled,
    CompassNorthwest20Filled,
    Library20Filled,
    Search20Filled,
    List20Filled,
    History20Filled,
    People20Filled,
    Album20Filled
} from "@fluentui/react-icons";
import {Link} from "@tanstack/react-router";

const useStyles = makeStyles({
    root: {
        overflow: "hidden",
        display: "flex",
        height: "100%",
        width: "100%"
    },
});

type DrawerType = Required<DrawerProps>["type"];

const Nav: React.FC = () => {
    const styles = useStyles();

    return (
        <div className={styles.root}>
            <NavDrawer
                style={{
                    width: "100%",
                }}
                defaultSelectedValue="2"
                defaultSelectedCategoryValue="1"
                open={true}
                type={"inline"}
                reserveSelectedNavItemSpace={true}
            >
                <div style={{
                    height: "64px",
                    lineHeight: "64px",
                    alignContent: "center",
                    textAlign: "center",
                    justifyContent: "center",
                    fontSize: "20px"
                }}>
                    <NavDrawerHeader>{"Planet"}</NavDrawerHeader>
                </div>
                <NavDrawerBody>
                    <Link to={"/home"}>
                        <NavItem icon={<Home20Filled/>} value="1">
                            Home
                        </NavItem>
                    </Link>
                    {/*<Link to={"/playlist"}>*/}
                    {/*    <NavItem icon={<Home20Filled/>} value="10">*/}
                    {/*        Playlist*/}
                    {/*    </NavItem>*/}
                    {/*</Link>*/}
                    {/*<Link to={"/explore"}>*/}
                    {/*    <NavItem icon={<CompassNorthwest20Filled/>} value="2">*/}
                    {/*        Explore*/}
                    {/*    </NavItem>*/}
                    {/*</Link>*/}
                    {/*<Link to={"/album"}>*/}
                    {/*    <NavItem icon={<Library20Filled/>} value="4">*/}
                    {/*        Library*/}
                    {/*    </NavItem>*/}
                    {/*</Link>*/}
                    <NavItem
                        icon={<Search20Filled/>}
                        value="3"
                    >
                        Search
                    </NavItem>
                    <NavSectionHeader>Your Music</NavSectionHeader>
                    <NavItem icon={<List20Filled/>} value="9">
                        Playlists
                    </NavItem>
                    <NavItem icon={<People20Filled/>} value="10">
                        Artists
                    </NavItem>
                    <NavItem icon={<Album20Filled/>} value="11">
                        Albums
                    </NavItem>
                    <NavItem icon={<History20Filled/>} value="12">
                        Recently
                    </NavItem>
                </NavDrawerBody>
            </NavDrawer>
        </div>
    );
};

export default Nav