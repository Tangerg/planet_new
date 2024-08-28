import {makeStyles} from "@fluentui/react-components";

export const cardFlow = makeStyles({
    root: {
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "5px",
        contentVisibility: "auto",
    },
    card: {
        display: "inline-flex",
        flexDirection: "column",
        rowGap: "8px",
        paddingBlock: "12px",
        paddingInline: "12px",
        cursor: "pointer",
        minBlockSize: "48px",
        position: "relative",
        boxSizing: "border-box"
    }
})


export const card = makeStyles({
    background: {
        position: "absolute",
        inset: "0px",
        width: "100%",
        border: "none",
        borderRadius: "4px",
    },
    thumbnail: {
        zIndex: 100,
    },
    text: {
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        columnGap: "12px"
    },
    text_column: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        flexBasis: "100%",
        alignItems: "flex-start"
    },
    text_primary: {
        fontSize: "16px",
        fontWeight: 400
    },
    text_second: {
        fontSize: "14px",
        fontWeight: 400,
        color: "rgb(179,179,179)"
    }
})