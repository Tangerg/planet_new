import {Track} from "../planet/model/track";
import {IProvider} from "../planet/core";

export abstract class AbstractProvider implements IProvider {
    get id(): string {
        return this.name()
    }

    abstract name(): string

    abstract playlist(id: string): Promise<Track[]>

}

export default AbstractProvider
