import {Track} from "../planet/model/track";
import AbstractProvider from "./provider";


export class NeteaseCloudMusic extends AbstractProvider {
    public static Name: string = "NeteaseCloudMusic"

    name(): string {
        return NeteaseCloudMusic.Name
    }

    playlist(id: string): Promise<Track[]> {
        throw new Error("Method not implemented.");
    }

}

export default NeteaseCloudMusic
