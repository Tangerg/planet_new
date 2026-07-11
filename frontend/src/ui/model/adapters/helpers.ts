import type { ArtistCredit as DomainArtistCredit } from "@contexts/catalog";

import type { ArtistRef } from "@/model/vibe";

export function toArtistRefs(credits: readonly DomainArtistCredit[]): ArtistRef[] {
  return credits.map((credit) => ({ id: credit.id ?? "", name: credit.name }));
}
