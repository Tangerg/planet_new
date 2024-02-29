import {FC} from "react";
import "./index.styl"
import Header from "./header";
import Body from "./body";

const Menu: FC = () => {
    return <aside className={"menu"}>
        <Header/>
        <Body/>
    </aside>
}
export default Menu
