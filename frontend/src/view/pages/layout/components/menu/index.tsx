import {FC} from "react";
import "./index.styl"
import Header from "./header";
import {NavDrawerDefault} from "./body";

const Menu: FC = () => {
    return <aside className={"menu"}>
        <Header/>
        <NavDrawerDefault/>
    </aside>
}
export default Menu
