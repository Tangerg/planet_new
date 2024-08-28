import * as React from "react";
import {
    Clock20Regular
} from "@fluentui/react-icons";
import {
    DataGridBody,
    DataGridRow,
    DataGrid,
    DataGridHeader,
    DataGridHeaderCell,
    DataGridCell,
    TableCellLayout,
    Image,
    Tooltip,
    TableColumnDefinition,
    createTableColumn,
} from "@fluentui/react-components";
import {
    mergeClasses,
    dataGridRowClassNames,
} from "@fluentui/react-components";
import {trackList} from "./style";
import {Track} from "../../../packages/model/track";
import {
    formatDuration,
    Minute, Second
} from "../../../packages/shared-utils/time";
import {usePlanet} from "../../hooks/usePlanet";

type TrackItem = Partial<Track>
const columnsWithAlbum: TableColumnDefinition<TrackItem>[] = [
    createTableColumn<TrackItem>({
        columnId: "id",
        renderHeaderCell: () => {
            return "#";
        },
        renderCell: (item) => {
            return (
                <TableCellLayout>
                    {item.index}
                </TableCellLayout>
            );
        },
    }),
    createTableColumn<TrackItem>({
        columnId: "name",
        renderHeaderCell: () => {
            return "Title";
        },
        renderCell: (item) => {
            return (
                <TableCellLayout media={
                    <Image
                        alt={item.name}
                        shape="rounded"
                        src={item.album?.image}
                        height={40}
                        width={40}
                        key={"title_image"}
                    />}>
                    <Tooltip
                        appearance="inverted"
                        content={item.name!}
                        relationship="description"
                        key={"title_tooltip_name"}
                    >
                        <div>{item.name}</div>
                    </Tooltip>
                    {item.artists?.map((artist, index) => {
                        if (index === 2) {
                            return <span>...</span>
                        }
                        if (index > 3) {
                            return null
                        }
                        return <Tooltip
                            appearance="inverted"
                            content={artist.name!}
                            relationship="description"
                            key={`title_artist_${index}`}
                        >
                            <span>{artist.name}</span>
                        </Tooltip>
                    })}
                </TableCellLayout>
            );
        },
    }),
    createTableColumn<TrackItem>({
        columnId: "album",
        renderHeaderCell: () => {
            return "Album";
        },
        renderCell: (item) => {
            return (
                <TableCellLayout>
                    <Tooltip
                        withArrow
                        appearance="inverted"
                        content={item.album!.name!}
                        relationship="label"
                    >
                        <div>{item.album!.name!}</div>
                    </Tooltip>
                </TableCellLayout>
            );
        },
    }),
    createTableColumn<TrackItem>({
        columnId: "duration",
        renderHeaderCell: () => {
            return <Tooltip
                withArrow
                appearance="inverted"
                content="Duration"
                relationship="label"
            >
                <Clock20Regular/>
            </Tooltip>
        },
        renderCell: (item) => {
            return (
                <TableCellLayout>
                    {formatDuration(item.duration!, [Minute, Second])}
                </TableCellLayout>
            );
        },
    }),
];
const columnsWithoutAlbum: TableColumnDefinition<TrackItem>[] = [
    createTableColumn<TrackItem>({
        columnId: "id",
        renderHeaderCell: () => {
            return "#";
        },
        renderCell: (item) => {
            return (
                <TableCellLayout>
                    {item.index}
                </TableCellLayout>
            );
        },
    }),
    createTableColumn<TrackItem>({
        columnId: "name",
        renderHeaderCell: () => {
            return "Title";
        },
        renderCell: (item) => {
            return (
                <TableCellLayout>
                    <Tooltip
                        appearance="inverted"
                        content={item.name!}
                        relationship="description"
                        key={"title_tooltip_name"}
                    >
                        <div>{item.name}</div>
                    </Tooltip>
                    {item.artists?.map((artist, index) => {
                        if (index === 2) {
                            return <span>...</span>
                        }
                        if (index > 3) {
                            return null
                        }
                        return <Tooltip
                            appearance="inverted"
                            content={artist.name!}
                            relationship="description"
                            key={`title_artist_${index}`}
                        >
                            <span>{artist.name}</span>
                        </Tooltip>
                    })}
                </TableCellLayout>
            );
        },
    }),
    createTableColumn<TrackItem>({
        columnId: "duration",
        renderHeaderCell: () => {
            return <Tooltip
                withArrow
                appearance="inverted"
                content="Duration"
                relationship="label"
            >
                <Clock20Regular/>
            </Tooltip>
        },
        renderCell: (item) => {
            return (
                <TableCellLayout>
                    {formatDuration(item.duration!, [Minute, Second])}
                </TableCellLayout>
            );
        },
    }),
];

interface TrackListProps {
    tracks: Track[];
    hiddenAlbum?: boolean;
    onRowClick?: (item: Track, items?: Track[]) => void
}

const TrackList: React.FC<TrackListProps> = (props) => {
    const {tracks, hiddenAlbum, onRowClick} = props;
    const columns = hiddenAlbum ? columnsWithoutAlbum : columnsWithAlbum;
    const classes = trackList()

    return <div style={{padding: "10px"}}>
        <DataGrid
            items={tracks}
            columns={columns}
            getRowId={(item) => item.id}
            focusMode="composite"
            style={{minWidth: "500px"}}
        >
            <DataGridHeader>
                <DataGridRow
                    style={{
                        marginBottom: "8px"
                    }}
                >
                    {({renderHeaderCell}) => (
                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                    )}
                </DataGridRow>
            </DataGridHeader>
            <DataGridBody<TrackItem>>
                {({item, rowId}) => {
                    return <DataGridRow<TrackItem>
                        className={mergeClasses(classes.row, dataGridRowClassNames.root)}
                        key={rowId}
                        onClick={() => {
                            onRowClick?.(item as Track, tracks)
                        }}
                    >
                        {({renderCell}) => (
                            <DataGridCell>{renderCell(item)}</DataGridCell>
                        )}
                    </DataGridRow>
                }}
            </DataGridBody>
        </DataGrid>
    </div>
};

export default TrackList