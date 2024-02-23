import {Track} from "../planet/model/track";
import AbstractProvider from "./provider";


export class Spotify extends AbstractProvider {
    public static Name = "Spotify"

    name(): string {
        return Spotify.Name
    }

    playlist(id: string): Promise<Track[]> {
        throw new Error("Method not implemented.");
    }

}

export default Spotify
