import {makeStyles} from "@fluentui/react-components";

export const player = makeStyles({
    root: {
        userSelect: "none",
        minWidth: "620px",
        height: "auto",
        display: "flex",
        flexDirection: "column"
    },
    container: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderBottom: "1px solid black",
        justifyContent: "space-between"
    },
    meta: {
        width: "30%",
        minWidth: "180px",
        paddingInlineStart: "8px"
    },
    control: {
        width: "40%",
        maxWidth: "722px",
    },
    action: {
        width: "30%",
        minWidth: "180px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingInlineEnd: "8px"
    }
})

export const meta = makeStyles({
    root: {
        display: "flex",
        flexDirection: "row",
        position: "relative",
        justifyContent: "flex-start",
        alignItems: "center"
    },
    thumbnail: {
        solation: "isolate",
        position: "relative",
        paddingInlineEnd: "8px",
        flexShrink: 0
    },
    info: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        margin: "0 8px",
    },
    info_title: {
        fontSize: "14px",
        fontWeight: 400,
    },
    info_artist: {
        fontSize: "12px",
        fontWeight: 400,
        color: "#b3b3b3"
    }
})
export const control = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
    },
    actions: {
        width: "100%",
        display: "flex",
        flexFlow: "row nowrap",
        gap: "16px",
    },
    action_left: {
        flex: 1,
        display: "flex",
        gap: "8px",
        justifyContent: "flex-end"
    },
    action_right: {
        flex: 1,
        display: "flex",
        gap: "8px",
    },
    progress: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px"
    },
    progress_duration: {
        fontSize: "12px"
    }
})
export const action = makeStyles({
    root: {
        display: "flex",
        flexGrow: 1,
        justifyContent: "flex-end",
        alignItems: "center"
    }
})