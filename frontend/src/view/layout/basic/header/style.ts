import {makeStyles} from "@fluentui/react-components";

export const header = makeStyles({
    root: {
        contain: "content",
        display: "flex",
        height: "64px",
        position: "absolute",
        width: "100%",
        alignItems: "center",
        zIndex: 200,
    },
    mask: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        overflow: "hidden",
        zIndex: -1,
        background: "rgb(64,56,56)",
        opacity: 0
    },
    mask_inner: {
        height: "100%",
        background: "rgba(0,0,0,0.6)"
    }
})

export const hearderContent = makeStyles({
    root: {
        display: "flex",
        gap: "8px",
        width: "100%",
        whiteSpace: "nowrap",
        justifyContent: "space-between",
        alignItems: "center",
        marginInline: "12px"
    },
    history: {
        display: "flex",
        gap: "8px"
    },
    slot: {
        minWidth: 0,
        flexGrow: 1,
    },
    persion: {
        display: "flex",
        gap: "8px",
        flexFlow: "row nowrap"
    }
})