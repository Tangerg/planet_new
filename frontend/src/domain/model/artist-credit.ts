/**
 * A credited artist name as it appears on a track, album, or music video.
 *
 * This is intentionally not the full Artist entity: provider list payloads often
 * carry only an id/name pair, and sometimes only a name. Keeping the credit as a
 * small value object lets domain models expose the music-industry concept
 * without leaking UI-specific `{ id, name }` mapping everywhere.
 */
export type ArtistCredit = {
  id?: string;
  name: string;
};

type CreditableArtist = {
  id?: string | number;
  name?: string;
};

function toCredit(artist: CreditableArtist | undefined): ArtistCredit | undefined {
  const name = artist?.name?.trim();
  if (!name) return undefined;

  const id = artist?.id === undefined ? undefined : String(artist.id);
  return { id, name };
}

export const ArtistCredit = {
  from(
    artists?: readonly CreditableArtist[],
    fallback?: readonly CreditableArtist[],
  ): ArtistCredit[] {
    const primary = (artists ?? []).map(toCredit).filter((x): x is ArtistCredit => Boolean(x));
    if (primary.length) return primary;
    return (fallback ?? []).map(toCredit).filter((x): x is ArtistCredit => Boolean(x));
  },

  primary(credits: readonly ArtistCredit[]): ArtistCredit | undefined {
    return credits[0];
  },

  names(credits: readonly ArtistCredit[]): string {
    return credits.map((credit) => credit.name).join(", ");
  },
};
