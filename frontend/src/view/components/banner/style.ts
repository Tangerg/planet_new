import {makeStyles} from "@fluentui/react-components";

export const banner = makeStyles({
    root: {
        display: "flex",
        paddingBottom: "16px",
        position: "relative",
        width: "100%",
        maxHeight: "400px",
        minHeight: "250px",
        height: "min(30vh,250px)",
        color: "#fff",
    },
    background: {
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        display: "block",
        background: "#403838",
    },
    backgroundmask: {
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        display: "block",
        background: "linear-gradient(transparent 0, rgba(0, 0, 0, .5) 100%)"
    },
    content: {
        width: "100%",
        padding: "0 16px",
        marginInline: "auto",
        display: "flex",
        zIndex: "100"
    },
})

export const bannerContent = makeStyles({
    thumbnail: {
        height: "128px",
        width: "128px",
        marginRight: "16px",
        alignItems: "flex-end",
        alignSelf: "flex-end"
    },
    meta: {
        display: "flex",
        flex: 1,
        flexFlow: "column",
        justifyContent: "flex-end"
    },
    meta_title: {
        fontSize: "96px",
        fontWeight: 800,
        lineHeight: "normal",
        textAlign: "left",
        width: "100%",
        wordBreak: "break-word"
    },
    meta_creator: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "5px"
    },
    meta_tracks: {
        marginTop: "8px"
    }
})