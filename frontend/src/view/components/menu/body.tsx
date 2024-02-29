import React, {FC} from "react";
import {Listbox, ListboxItem} from "@nextui-org/react";

const ListboxWrapper: FC<React.PropsWithChildren> = (props) => {
    const {children} = props
    return <div
        className="w-full max-w-[250px] px-1 py-2">
        {children}
    </div>
}
const Body: FC = () => {
    return (
        <ListboxWrapper>
            <Listbox variant="faded" aria-label="Listbox menu with icons">
                <ListboxItem
                    key="new"
                >
                    New file
                </ListboxItem>
                <ListboxItem
                    key="copy"
                >
                    Copy link
                </ListboxItem>
                <ListboxItem
                    key="edit"
                    showDivider
                >
                    Edit file
                </ListboxItem>
                <ListboxItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                >
                    Delete file
                </ListboxItem>
            </Listbox>
        </ListboxWrapper>
    );
}
export default Body
