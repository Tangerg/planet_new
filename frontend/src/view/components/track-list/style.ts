import {makeStyles} from "@fluentui/react-components";

export const trackList = makeStyles({
    row: {
        border: "none",
        padding: "8px 0",
        borderRadius: "4px"
    },
    row_index: {
        flex: "1 0 16px",
        background: "red"
    },
    row_title: {
        flex: "8"
    },
    row_album: {
        flex: "4"
    },
    row_duration: {
        flex: "2 0 50px"
    }
})