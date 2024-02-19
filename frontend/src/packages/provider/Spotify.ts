import {Track} from "../planet/model/track";
import {IProvider} from "../planet/provider";

export const PlatformSpotify = " Spotify"

export class Spotify implements IProvider {
    platform(): string {
        return PlatformSpotify
    }

    playlist(id: string): Promise<Track[]> {
        throw new Error("Method not implemented.");
    }

}

export default Spotify
