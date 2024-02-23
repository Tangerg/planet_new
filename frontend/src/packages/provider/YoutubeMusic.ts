import {Track} from "../planet/model/track";
import {IProvider} from "../planet/provider";

export const PlatformYoutubeMusic = "YoutubeMusic"

export class YoutubeMusic implements IProvider {
    id(): string {
        return this.name()
    }

    name(): string {
        return PlatformYoutubeMusic
    }

    playlist(id: string): Promise<Track[]> {
        throw new Error("Method not implemented.");
    }

}

export default YoutubeMusic
