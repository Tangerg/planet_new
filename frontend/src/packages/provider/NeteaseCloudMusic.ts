import {Track} from "../planet/model/track";
import {IProvider} from "../planet/provider";

export const PlatformNeteaseCloudMusic = "NeteaseCloudMusic"

export class NeteaseCloudMusic implements IProvider {
    id(): string {
        return this.name()
    }

    name(): string {
        return PlatformNeteaseCloudMusic
    }

    playlist(id: string): Promise<Track[]> {
        throw new Error("Method not implemented.");
    }

}

export default NeteaseCloudMusic
