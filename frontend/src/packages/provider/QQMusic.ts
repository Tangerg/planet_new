import {Track} from "../planet/model/track";
import AbstractProvider from "./provider";


export class QQMusic extends AbstractProvider {
    public static Name: string = "QQMusic"

    name(): string {
        return QQMusic.Name
    }

    playlist(id: string): Promise<Track[]> {
        throw new Error("Method not implemented.");
    }

}

export default QQMusic
