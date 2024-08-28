import React from "react";
import {makeStyles, Text} from "@fluentui/react-components";

const title = makeStyles({
    root: {
        height: "60px",
        width: "100%",
        paddingBlock: 0,
        display: "flex",
        justifyContent: "space-between"
    },
    title: {
        justifyItems: "center",
        alignItems: "center",
        display: "flex"
    }
})

interface TitleProps {
    content: string
}

const Title: React.FC<TitleProps> = (props) => {
    const {content} = props
    const classes = title()
    return <div className={classes.root}>
        <div className={classes.title}>
            <Text size={600} weight={"semibold"}>{content}</Text>
        </div>
    </div>
}

export default Title