import type { PlaylistSnapshot } from "./playlist";
import type { AlbumSnapshot } from "./album";
import type { TrackSnapshot } from "./track";
import type { ArtistSnapshot } from "./artist";

export type Personalized = {
  playlists: PlaylistSnapshot[];
  albums?: AlbumSnapshot[];
  artists?: ArtistSnapshot[];
  tracks?: TrackSnapshot[];
};
