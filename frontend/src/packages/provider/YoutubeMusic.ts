import {Track} from "../planet/model/track";
import AbstractProvider from "./provider";

export class YoutubeMusic extends AbstractProvider {
    public static Name: string = "YoutubeMusic"

    name(): string {
        return YoutubeMusic.Name
    }

    playlist(id: string): Promise<Track[]> {
        throw new Error("Method not implemented.");
    }

}

export default YoutubeMusic
