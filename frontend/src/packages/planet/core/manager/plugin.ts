import AbstractManager from "./manager";
import {IPlugin} from "../types";

export class PluginManager extends AbstractManager<IPlugin> {
    constructor() {
        super();
    }
}
