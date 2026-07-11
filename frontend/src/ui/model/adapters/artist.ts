import { Artist, type ArtistSnapshot } from "@contexts/catalog";

import { seedOf, type VibeArtist } from "@/model/vibe";
import { toVibeAlbum } from "@/model/adapters/collection";

export function toVibeArtist(artist: ArtistSnapshot): VibeArtist {
  return {
    id: artist.id,
    name: artist.name,
    coverSeed: seedOf(artist.id),
    gradient: undefined,
    image: Artist.coverUrl(artist),
    images: artist.images,
    banner: artist.banner,
    listeners: artist.followers,
    genres: artist.genres ?? [],
    bio: artist.description ?? "",
    albums: (artist.albums ?? []).map(toVibeAlbum),
    similar: (artist.similar ?? []).map(toVibeArtist),
  };
}
