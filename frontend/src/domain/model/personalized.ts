import type { Playlist } from "./playlist";
import type { Album } from "./album";
import type { Track } from "./track";
import type { Artist } from "./artist";

export type Personalized = {
  playlists: Partial<Playlist>[];
  albums?: Partial<Album>[];
  artists?: Partial<Artist>[];
  tracks?: Partial<Track>[];
};
