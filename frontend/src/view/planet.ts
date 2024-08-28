import {Planet} from "../packages/core";
import {Control, Volume} from "../packages/plugin";
import {PlayQueue} from "../packages/plugin/playqueue";
import {Progress} from "../packages/plugin/progress";
import Store from "./store-planet";

const control = new Control();
const playqueue = new PlayQueue();
const volume = new Volume();
const progress = new Progress();
const store = new Store()
const planet = new Planet({
    plugins: [
        control,
        playqueue,
        volume,
        progress,
        store
    ]
})
export default planet