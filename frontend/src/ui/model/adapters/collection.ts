import { Album, Playlist, type AlbumSnapshot, type PlaylistSnapshot } from "@contexts/catalog";

import { seedOf, type VibeCollection } from "@/model/vibe";
import { toVibeTracks } from "@/model/adapters/track";

export function toVibePlaylist(playlist: PlaylistSnapshot): VibeCollection {
  return {
    id: playlist.id,
    name: playlist.name,
    kind: "playlist",
    owner: Playlist.ownerName(playlist),
    coverSeed: seedOf(playlist.id),
    gradient: undefined,
    image: Playlist.coverUrl(playlist),
    images: playlist.images,
    description: playlist.description,
    tracks: toVibeTracks(playlist.tracks),
    trackCount: Playlist.trackCount(playlist),
  };
}

export const toVibePlaylists = (playlists?: readonly PlaylistSnapshot[]) =>
  (playlists ?? []).map((playlist) => toVibePlaylist(playlist));

export function toVibeAlbum(album: AlbumSnapshot): VibeCollection {
  const artistName = Album.artistNames(album);
  return {
    id: album.id,
    name: album.name,
    kind: "album",
    artist: artistName,
    artistId: Album.primaryArtist(album)?.id,
    owner: artistName || undefined,
    coverSeed: seedOf(album.id),
    gradient: undefined,
    image: Album.coverUrl(album),
    images: album.images,
    year: Album.year(album),
    description: album.description || artistName,
    tracks: toVibeTracks(album.tracks),
    trackCount: Album.trackCount(album),
  };
}
