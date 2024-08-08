import {FC} from "react";
import "./index.styl"
import {Menu, Player, Content, Header} from "./components";

const Layout: FC = () => {
    return <main className={"planet"}>
        <div className={"planet-main"}>
            <Menu/>
            <div className={"planet-main-right"}>
                <Header/>
                <Content/>
            </div>
        </div>
        <Player/>
        <Player/>
    </main>
}
export default Layout