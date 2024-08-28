import {makeStyles} from "@fluentui/react-components";

export const basic = makeStyles({
    root: {
        display: "grid",
        gridTemplate: `
            "nav view view"
            "footer footer footer"
        `,
        gridTemplateColumns: "300px 1fr 1fr",
        gridTemplateRows: "auto auto auto",
        position: "relative",
        width: "100%",
        height: "100%"
    },
    nav: {
        width: "300px",
        gridArea: "nav",
        gridAutoRows: "auto",
        height: "100%,"
    },
    view: {
        gridArea: "view",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        position: "relative",
    },
    footer: {
        gridArea: "footer",
        width: "100%"
    }
})