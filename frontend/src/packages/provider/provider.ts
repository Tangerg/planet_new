import {IProvider} from "./types";
import {Playlist} from "../model/playlist";
import {Lyric} from "../model/lyric";
import {Album} from "../model/album";
import {TrackPlayUrl} from "../model/track";
import {Personalized} from "../model/personalized";

abstract class Provider implements IProvider {

    abstract get name(): string

    abstract playlistDetail(id: string): Promise<Playlist>

    abstract lyric(id: string): Promise<Lyric[]>

    abstract albumDetail(id: string): Promise<Album>

    abstract playUrls(ids: string[]): Promise<TrackPlayUrl[]>

    abstract personalized(): Promise<Personalized>
}

export default Provider