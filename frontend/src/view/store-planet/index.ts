import {Plugin} from "../../packages/planet/plugin";
import {useStore} from "../store/playqueue"


class Store extends Plugin {
    constructor() {
        super();
    }

    name(): string {
        return this.fullname("store")
    }

    init() {
        this.planet.eventEmitter.on("ADDTRACK", (t) => {
            useStore.selectors.changeCurrentTrack()(t)
        })
    }
}

export default Store
