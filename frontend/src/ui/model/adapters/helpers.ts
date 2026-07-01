import type { ArtistCredit as DomainArtistCredit } from "@domain/model/artist-credit";

import type { ArtistRef } from "@/model/vibe";

export function toArtistRefs(credits: readonly DomainArtistCredit[]): ArtistRef[] {
  return credits.map((credit) => ({ id: credit.id ?? "", name: credit.name }));
}
