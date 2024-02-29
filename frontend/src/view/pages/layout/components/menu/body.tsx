import React, {FC} from "react";
import {Listbox, ListboxItem} from "@nextui-org/react";
import classnames from "classnames";
import {NavLink,Link} from "react-router-dom";


const Body: FC = () => {
    return (
        <div className={classnames("w-full max-w-[250px] px-1 py-2","menu-body")}>
            <Listbox variant="faded" aria-label="Listbox menu with icons">

                <ListboxItem
                    key="new"
                >
                    <NavLink
                        key="new"
                        to="messages"
                    >
                        Messages
                    </NavLink>
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
        </div>
    );
}
export default Body
