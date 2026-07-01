import { Album } from "@domain/model/album";
import type { Album as DomainAlbum } from "@domain/model/album";
import { Playlist } from "@domain/model/playlist";
import type { Playlist as DomainPlaylist } from "@domain/model/playlist";

import { seedOf, type VibeCollection } from "@/model/vibe";
import { toVibeTracks } from "@/model/adapters/track";

export function toVibePlaylist(playlist: Partial<DomainPlaylist>): VibeCollection {
  return {
    id: String(playlist.id ?? ""),
    name: playlist.name ?? "",
    kind: "Playlist",
    owner: Playlist.ownerName(playlist) ?? "Sonance",
    coverSeed: seedOf(playlist.id),
    gradient: undefined,
    image: Playlist.coverUrl(playlist),
    images: playlist.images,
    description: playlist.description,
    tracks: toVibeTracks(playlist.tracks),
    trackCount: Playlist.trackCount(playlist),
  };
}

export function toVibeAlbum(album: Partial<DomainAlbum>): VibeCollection {
  const artistName = Album.artistNames(album);
  return {
    id: String(album.id ?? ""),
    name: album.name ?? "",
    kind: "Album",
    artist: artistName,
    artistId: Album.primaryArtist(album)?.id,
    owner: artistName || "Sonance",
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
