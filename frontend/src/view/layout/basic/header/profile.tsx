import React from "react";
import {Avatar} from "@fluentui/react-components";
import {hearderContent} from "./style";

const Profile: React.FC = () => {
    const classes = hearderContent()
    return <div className={classes.persion}><Avatar color="colorful" initials="唐"/></div>
}
export default Profile