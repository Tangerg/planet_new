import {Track} from "../planet/model/track";
import {IProvider} from "../planet/provider";

export const PlatformQQMusic = "QQMusic"

export class QQMusic implements IProvider {
    platform(): string {
        return PlatformQQMusic
    }

    playlist(id: string): Promise<Track[]> {
        throw new Error("Method not implemented.");
    }

}

export default QQMusic
