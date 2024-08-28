import React from "react";
import {
    DrawerBody,
    DrawerHeader,
    DrawerHeaderTitle,
    Drawer,
    Button,
} from "@fluentui/react-components";
import {Dismiss24Regular} from "@fluentui/react-icons";
import TrackItem from "../../../components/track-item";
import {useStore} from "../../../store/playqueue";
import useAppStore, {queueOpenSelector} from "../../../store/app";

const QueueHeader: React.FC = () => {
    const setIsQueueOpen = useAppStore.use.setIsQueueOpen()
    return <DrawerHeader>
        <DrawerHeaderTitle
            action={
                <Button
                    appearance="subtle"
                    aria-label="Close"
                    icon={<Dismiss24Regular/>}
                    onClick={() => setIsQueueOpen(false)}
                />
            }
        >
            Queue
        </DrawerHeaderTitle>
    </DrawerHeader>
}
const QueueBody: React.FC = () => {
    const tracks = useStore.use.tracks()
    return <DrawerBody>
        <ul>
            {tracks?.map((track) => {
                return <li key={track.id}>
                    <TrackItem track={track}/>
                </li>
            })}
        </ul>
    </DrawerBody>
}

const Queue = () => {
    const [isQueueOpen, setIsQueueOpen] = useAppStore(queueOpenSelector)
    return (
        <Drawer
            separator
            position={"end"}
            style={{width: "400px"}}
            open={isQueueOpen}
            onOpenChange={(_, {open}) => setIsQueueOpen(open)}
        >
            <QueueHeader/>
            <QueueBody/>
        </Drawer>
    );
};

export default Queue