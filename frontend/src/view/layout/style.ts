import {makeStyles} from "@fluentui/react-components";

export const layoutStyle = makeStyles({
    root: {
        height: "clamp(100vh,100vh,100vh)",
        width: "clamp(100vw,100vw,100vw)",
        overflow: "hidden",
        background: "transparent",
        display: "flex",
        flexDirection: "column"
    },
})