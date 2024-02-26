import Provider from "./packages/planet/plugin/provider";
import {NeteaseCloudMusic} from "./packages/provider";
import {Planet} from "./packages/planet/core";


const pp = new Provider([new NeteaseCloudMusic()])
Planet.use(pp)
const planet = Planet.getInstance()

export default planet