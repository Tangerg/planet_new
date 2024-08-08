import {makeStyles} from "@fluentui/react-components";

export const player = makeStyles({
    root: {
        height: "72px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderBottom: "1px solid black",
        justifyContent:"space-between"
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
        display: "flex",
        flexDirection: "row"
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