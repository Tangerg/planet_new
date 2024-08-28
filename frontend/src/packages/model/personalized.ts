import {Playlist} from "./playlist";
import {Album} from "./album";
import {Track} from "./track";
import {Artist} from "./artist";

export type Personalized = {
    playlists: Partial<Playlist>[];
    albums?: Partial<Album>[];
    artists?: Partial<Artist>[];
    tracks?: Partial<Track>[];
}