import { Artist } from "@domain/model/artist";
import type { Artist as DomainArtist } from "@domain/model/artist";

import { seedOf, type VibeArtist } from "@/model/vibe";
import { toVibeAlbum } from "@/model/adapters/collection";

export function toVibeArtist(artist: Partial<DomainArtist>): VibeArtist {
  return {
    id: String(artist.id ?? ""),
    name: artist.name ?? "",
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
